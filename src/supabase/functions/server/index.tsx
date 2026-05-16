import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Authentication endpoints

// Signup
app.post('/make-server-ebf166d3/signup', async (c) => {
  try {
    const { email, password, name, role, farmLocation } = await c.req.json();
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.log(`Error creating user during signup: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store additional user info in KV store
    const userId = authData.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
      farmLocation: farmLocation || '',
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, user: authData.user });
  } catch (error) {
    console.log(`Error in signup endpoint: ${error}`);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Get current user info
app.get('/make-server-ebf166d3/user', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.log(`Error getting user: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    return c.json({ user: userData || user });
  } catch (error) {
    console.log(`Error fetching user data: ${error}`);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Livestock Management

// Add livestock
app.post('/make-server-ebf166d3/livestock', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const livestockData = await c.req.json();
    const animalId = `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animal = {
      id: animalId,
      ...livestockData,
      farmerId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`livestock:${animalId}`, animal);
    
    return c.json({ success: true, animal });
  } catch (error) {
    console.log(`Error adding livestock: ${error}`);
    return c.json({ error: 'Failed to add livestock' }, 500);
  }
});

// Get all livestock (filtered by role)
app.get('/make-server-ebf166d3/livestock', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const allLivestock = await kv.getByPrefix('livestock:');
    
    // Admins see all livestock, farmers only see their own
    let livestock = allLivestock;
    if (userData?.role === 'farmer') {
      livestock = allLivestock.filter((animal: any) => animal.farmerId === user.id);
    }

    return c.json({ livestock });
  } catch (error) {
    console.log(`Error fetching livestock: ${error}`);
    return c.json({ error: 'Failed to fetch livestock' }, 500);
  }
});

// Update livestock
app.put('/make-server-ebf166d3/livestock/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const animalId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`livestock:${animalId}`);
    if (!existing) {
      return c.json({ error: 'Animal not found' }, 404);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role === 'farmer' && existing.farmerId !== user.id) {
      return c.json({ error: 'Unauthorized to update this animal' }, 403);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`livestock:${animalId}`, updated);
    
    return c.json({ success: true, animal: updated });
  } catch (error) {
    console.log(`Error updating livestock: ${error}`);
    return c.json({ error: 'Failed to update livestock' }, 500);
  }
});

// Delete livestock
app.delete('/make-server-ebf166d3/livestock/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const animalId = c.req.param('id');
    const existing = await kv.get(`livestock:${animalId}`);
    
    if (!existing) {
      return c.json({ error: 'Animal not found' }, 404);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role === 'farmer' && existing.farmerId !== user.id) {
      return c.json({ error: 'Unauthorized to delete this animal' }, 403);
    }

    await kv.del(`livestock:${animalId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting livestock: ${error}`);
    return c.json({ error: 'Failed to delete livestock' }, 500);
  }
});

// Alerts Management

// Create alert
app.post('/make-server-ebf166d3/alerts', async (c) => {
  try {
    const alertData = await c.req.json();
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert = {
      id: alertId,
      ...alertData,
      createdAt: new Date().toISOString(),
      status: alertData.status || 'active'
    };

    await kv.set(`alert:${alertId}`, alert);
    
    return c.json({ success: true, alert });
  } catch (error) {
    console.log(`Error creating alert: ${error}`);
    return c.json({ error: 'Failed to create alert' }, 500);
  }
});

// Get alerts (filtered by role and farm)
app.get('/make-server-ebf166d3/alerts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const allAlerts = await kv.getByPrefix('alert:');
    
    // Filter alerts based on user role
    let alerts = allAlerts;
    if (userData?.role === 'farmer') {
      // Get farmer's livestock
      const livestock = await kv.getByPrefix('livestock:');
      const farmerAnimalIds = livestock
        .filter((animal: any) => animal.farmerId === user.id)
        .map((animal: any) => animal.id);
      
      // Filter alerts for farmer's animals
      alerts = allAlerts.filter((alert: any) => 
        farmerAnimalIds.includes(alert.animalId)
      );
    }

    return c.json({ alerts });
  } catch (error) {
    console.log(`Error fetching alerts: ${error}`);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});

// Update alert status
app.put('/make-server-ebf166d3/alerts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const alertId = c.req.param('id');
    const { status } = await c.req.json();
    
    const existing = await kv.get(`alert:${alertId}`);
    if (!existing) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    const updated = {
      ...existing,
      status,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : existing.resolvedAt
    };

    await kv.set(`alert:${alertId}`, updated);
    
    return c.json({ success: true, alert: updated });
  } catch (error) {
    console.log(`Error updating alert: ${error}`);
    return c.json({ error: 'Failed to update alert' }, 500);
  }
});

// Movement Tracking

// Add movement data
app.post('/make-server-ebf166d3/movements', async (c) => {
  try {
    const movementData = await c.req.json();
    const movementId = `movement_${movementData.animalId}_${Date.now()}`;
    
    const movement = {
      id: movementId,
      ...movementData,
      timestamp: new Date().toISOString()
    };

    await kv.set(`movement:${movementId}`, movement);
    
    return c.json({ success: true, movement });
  } catch (error) {
    console.log(`Error adding movement data: ${error}`);
    return c.json({ error: 'Failed to add movement data' }, 500);
  }
});

// Get movement history for an animal
app.get('/make-server-ebf166d3/movements/:animalId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const animalId = c.req.param('animalId');
    const allMovements = await kv.getByPrefix('movement:');
    
    const movements = allMovements
      .filter((m: any) => m.animalId === animalId)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ movements });
  } catch (error) {
    console.log(`Error fetching movements: ${error}`);
    return c.json({ error: 'Failed to fetch movements' }, 500);
  }
});

// Farmer Management (Admin only)

// Get all farmers
app.get('/make-server-ebf166d3/farmers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const farmers = allUsers.filter((u: any) => u.role === 'farmer');

    return c.json({ farmers });
  } catch (error) {
    console.log(`Error fetching farmers: ${error}`);
    return c.json({ error: 'Failed to fetch farmers' }, 500);
  }
});

// Update farmer
app.put('/make-server-ebf166d3/farmers/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const farmerId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`user:${farmerId}`);
    if (!existing) {
      return c.json({ error: 'Farmer not found' }, 404);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${farmerId}`, updated);
    
    return c.json({ success: true, farmer: updated });
  } catch (error) {
    console.log(`Error updating farmer: ${error}`);
    return c.json({ error: 'Failed to update farmer' }, 500);
  }
});

// Delete farmer
app.delete('/make-server-ebf166d3/farmers/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const farmerId = c.req.param('id');
    
    // Delete farmer from KV store
    await kv.del(`user:${farmerId}`);
    
    // Note: We're not deleting from Supabase Auth here
    // In production, you might want to also disable the auth account
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting farmer: ${error}`);
    return c.json({ error: 'Failed to delete farmer' }, 500);
  }
});

// Dashboard stats
app.get('/make-server-ebf166d3/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const allLivestock = await kv.getByPrefix('livestock:');
    const allAlerts = await kv.getByPrefix('alert:');

    let livestock = allLivestock;
    let alerts = allAlerts;

    // Filter for farmers
    if (userData?.role === 'farmer') {
      livestock = allLivestock.filter((animal: any) => animal.farmerId === user.id);
      const farmerAnimalIds = livestock.map((animal: any) => animal.id);
      alerts = allAlerts.filter((alert: any) => farmerAnimalIds.includes(alert.animalId));
    }

    const activeAlerts = alerts.filter((a: any) => a.status === 'active');
    const healthyAnimals = livestock.filter((a: any) => a.healthStatus === 'healthy');
    
    return c.json({
      totalLivestock: livestock.length,
      activeAlerts: activeAlerts.length,
      healthyAnimals: healthyAnimals.length,
      totalFarmers: userData?.role === 'admin' ? (await kv.getByPrefix('user:')).filter((u: any) => u.role === 'farmer').length : 0
    });
  } catch (error) {
    console.log(`Error fetching stats: ${error}`);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

Deno.serve(app.fetch);
