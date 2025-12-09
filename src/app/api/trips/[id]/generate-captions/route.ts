import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { DayPlan, TripSummary, DayCaptions, StoryTemplate } from '@/types/story';
import {
  buildMultiDayCaptionPrompt,
  getStyledSystemPrompt,
} from '@/lib/ai/storyPrompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type GenerateCaptionsRequest = {
  days: DayPlan[];
  tripSummary: TripSummary;
  template?: StoryTemplate;
};

type CaptionsResponse = {
  days: {
    dayIndex: number;
    headline: string;
    description: string;
    placeHighlights: string[];
  }[];
  tripSummary: string;
};

/**
 * POST /api/trips/[id]/generate-captions
 * Generates AI captions for story video
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify trip ownership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('user_id, privacy')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.user_id !== user.id && trip.privacy !== 'shared') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body: GenerateCaptionsRequest = await request.json();
    const { days, tripSummary, template = 'minimal' } = body;

    if (!days || !tripSummary) {
      return NextResponse.json(
        { error: 'Missing required fields: days and tripSummary' },
        { status: 400 }
      );
    }

    if (days.length === 0) {
      return NextResponse.json(
        { error: 'No days to generate captions for' },
        { status: 400 }
      );
    }

    // Generate captions using OpenAI
    const systemPrompt = getStyledSystemPrompt(template);
    const userPrompt = buildMultiDayCaptionPrompt(days, tripSummary);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response
    let captionsData: CaptionsResponse;
    try {
      captionsData = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Transform to DayCaptions format
    const captions: DayCaptions[] = captionsData.days.map((day) => ({
      dayIndex: day.dayIndex,
      headline: day.headline,
      description: day.description,
      placeHighlights: day.placeHighlights,
    }));

    return NextResponse.json({
      success: true,
      captions,
      tripSummaryCaption: captionsData.tripSummary,
      meta: {
        tripId,
        daysProcessed: days.length,
        template,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Caption generation error:', error);

    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate captions' },
      { status: 500 }
    );
  }
}
