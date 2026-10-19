import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Perform a lightweight query to keep Supabase awake
    const { error } = await supabase
      .from('point_categories')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'active',
      message: 'SPARK Database is awake',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to wake database' },
      { status: 500 }
    );
  }
}
