import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user already has rewards
    const { data: existingRewards } = await supabase
      .from('rewards')
      .select('id')
      .eq('parent_id', user.id)
      .limit(1);

    if (existingRewards && existingRewards.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Rewards already exist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const starterRewards = [
      {
        parent_id: user.id,
        title: '30 minutes extra screen time',
        description: 'Watch an extra episode or play games for 30 more minutes!',
        emoji: '📱',
        xp_cost: 100,
        requires_approval: false,
        active: true,
        metadata: {}
      },
      {
        parent_id: user.id,
        title: 'Ice cream treat',
        description: 'Pick your favorite flavor from the store!',
        emoji: '🍦',
        xp_cost: 150,
        requires_approval: true,
        active: true,
        metadata: {}
      },
      {
        parent_id: user.id,
        title: '$5 allowance boost',
        description: 'Extra $5 added to your allowance',
        emoji: '💵',
        xp_cost: 250,
        requires_approval: true,
        active: true,
        metadata: {}
      },
      {
        parent_id: user.id,
        title: 'Choose dinner menu',
        description: 'Pick what we have for dinner tonight!',
        emoji: '🍕',
        xp_cost: 200,
        requires_approval: true,
        active: true,
        metadata: {}
      },
      {
        parent_id: user.id,
        title: 'Stay up 30 minutes late',
        description: 'Extend bedtime by 30 minutes on a school night',
        emoji: '🌙',
        xp_cost: 175,
        requires_approval: true,
        active: true,
        metadata: {}
      },
      {
        parent_id: user.id,
        title: 'Focus Duck tiny beret 🎩',
        description: 'Add a adorable tiny red beret to your Focus Duck! Toggle it on/off anytime.',
        emoji: '🎩',
        xp_cost: 500,
        requires_approval: false,
        active: true,
        metadata: { type: 'focus_duck_cosmetic', cosmetic_id: 'beret' }
      },
      {
        parent_id: user.id,
        title: 'Movie night pick',
        description: 'Choose the movie for family movie night!',
        emoji: '🎬',
        xp_cost: 300,
        requires_approval: true,
        active: true,
        metadata: {}
      },
      {
        parent_id: user.id,
        title: 'Skip one chore',
        description: 'Get out of doing one assigned chore',
        emoji: '🧹',
        xp_cost: 200,
        requires_approval: true,
        active: true,
        metadata: {}
      }
    ];

    const { error: insertError } = await supabase
      .from('rewards')
      .insert(starterRewards);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${starterRewards.length} starter rewards`,
        count: starterRewards.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting up starter rewards:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
