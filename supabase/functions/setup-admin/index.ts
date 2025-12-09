import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminEmail = 'johnvictorsf1512@gmail.com';
    const adminPassword = '151206';

    console.log('Creating admin user...');

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      console.log('User already exists, updating password...');
      userId = existingUser.id;
      
      // Update the password
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
      });
    } else {
      console.log('Creating new user...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      userId = newUser.user!.id;
    }

    console.log('User ID:', userId);

    // Check if already in admin_users
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingAdmin) {
      console.log('Adding user to admin_users table...');
      const { error: insertError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          id: userId,
          email: adminEmail,
        });

      if (insertError) {
        console.error('Error inserting admin:', insertError);
        throw insertError;
      }
    } else {
      console.log('User already in admin_users table');
    }

    console.log('Admin setup complete!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin configurado com sucesso!',
        email: adminEmail 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
