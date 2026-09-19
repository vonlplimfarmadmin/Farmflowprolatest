import { 
  getMongoStatus, 
  syncAllToMongo, 
  pullAllFromMongo, 
  saveMongoDoc, 
  deleteMongoDoc, 
  getMongoDb 
} from '../../server/mongodb';

export const handler = async (event: any) => {
  // CORS & Cache control headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Extract relative path after /api/mongodb or /.netlify/functions/mongodb
  const rawPath = event.path || '';
  let subPath = rawPath
    .replace(/^\/\.netlify\/functions\/mongodb/, '')
    .replace(/^\/api\/mongodb/, '')
    .replace(/^\/api/, '');

  if (!subPath || subPath === '/') {
    subPath = '/status';
  }

  try {
    // 1. Health & Status
    if (subPath === '/status' || subPath === '/health') {
      const status = await getMongoStatus();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(status),
      };
    }

    // 2. Pull all farm collections
    if (subPath === '/pull' && event.httpMethod === 'GET') {
      const result = await pullAllFromMongo();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // 3. Sync all farm data into MongoDB
    if (subPath === '/sync' && event.httpMethod === 'POST') {
      const payload = event.body ? JSON.parse(event.body) : {};
      const result = await syncAllToMongo(payload);
      return {
        statusCode: result.success ? 200 : 500,
        headers,
        body: JSON.stringify(result),
      };
    }

    // 4. Save individual document (/doc/:collection/:id)
    const docMatch = subPath.match(/^\/doc\/([^/]+)\/([^/]+)$/);
    if (docMatch && event.httpMethod === 'POST') {
      const collectionName = decodeURIComponent(docMatch[1]);
      const id = decodeURIComponent(docMatch[2]);
      const body = event.body ? JSON.parse(event.body) : {};
      const result = await saveMongoDoc(collectionName, id, body);
      return {
        statusCode: result.success ? 200 : 500,
        headers,
        body: JSON.stringify(result),
      };
    }

    // 5. Delete individual document
    if (docMatch && event.httpMethod === 'DELETE') {
      const collectionName = decodeURIComponent(docMatch[1]);
      const id = decodeURIComponent(docMatch[2]);
      const result = await deleteMongoDoc(collectionName, id);
      return {
        statusCode: result.success ? 200 : 500,
        headers,
        body: JSON.stringify(result),
      };
    }

    // 6. Farm profile endpoints
    if (subPath.startsWith('/farm-profile')) {
      const db = await getMongoDb();
      if (!db) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Database not connected' }),
        };
      }

      if (event.httpMethod === 'GET') {
        const profile = await db.collection('farmProfile').findOne({
          $or: [{ _id: 'main_farm_profile' as any }, { id: 'main_farm_profile' }],
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(profile || {}),
        };
      }

      if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
        const body = event.body ? JSON.parse(event.body) : {};
        const cleanId = 'main_farm_profile';
        await db.collection('farmProfile').updateOne(
          { $or: [{ _id: cleanId as any }, { id: cleanId }] },
          { $set: { ...body, id: cleanId, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Farm profile saved' }),
        };
      }
    }

    // Default 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Path ${rawPath} not found in MongoDB function` }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err?.message || 'Internal server error in MongoDB function',
      }),
    };
  }
};
