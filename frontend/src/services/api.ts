import type { TripPlanRequest, TripPlanResponse } from '../types/trip';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function planTrip(requestData: TripPlanRequest): Promise<TripPlanResponse> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/trips/plan/`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data && data.error) {
        throw new Error(data.error);
      } else if (data && data.details) {
        const errorMsgs = Object.entries(data.details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        throw new Error(`Validation Error: ${errorMsgs}`);
      }
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    return data as TripPlanResponse;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Unable to connect to backend service. Please verify that the API server is online and accessible.'
      );
    }
    throw error;
  }
}
