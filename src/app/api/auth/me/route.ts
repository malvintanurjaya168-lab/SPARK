import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { POINT_BASE } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch latest user data including points
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nomor_induk, name, role, kelas, angkatan, initial_points, wali_kelas')
      .eq('id', session.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Fetch total points for this user
    const { data: logs, error: logsError } = await supabase
      .from('point_logs')
      .select('points_changed')
      .eq('student_id', session.id);

    const initialPoints = user.initial_points || 100; // Default to 100 if not set
    let totalPoints = initialPoints;
    if (!logsError && logs) {
      totalPoints += logs.reduce((sum, log: any) => sum + (log.points_changed || 0), 0);
    }

    // Return user data with calculated total_points
    const response = NextResponse.json({ 
      ...user, 
      total_points: totalPoints 
    });
    
    // Add cache control to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
