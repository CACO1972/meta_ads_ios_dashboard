/**
 * Meta Ads Executor Service
 * Executes real actions on Meta Ads API (pause/activate ads, change budgets, etc.)
 */

interface MetaAdsCredentials {
  accessToken: string;
  adAccountId: string;
}

interface ExecutionResult {
  success: boolean;
  action: string;
  targetId: string;
  targetType: string;
  previousState?: any;
  newState?: any;
  error?: string;
  metaApiResponse?: any;
}

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Execute a Meta Ads API request
 */
async function metaApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  accessToken: string,
  body?: Record<string, any>
): Promise<any> {
  const url = `${META_API_BASE}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add access token to URL params
  const urlWithToken = new URL(url);
  urlWithToken.searchParams.set('access_token', accessToken);

  // For POST requests, add body params to URL (Meta API style)
  if (method === 'POST' && body) {
    Object.entries(body).forEach(([key, value]) => {
      urlWithToken.searchParams.set(key, String(value));
    });
  }

  console.log(`[MetaAdsExecutor] ${method} ${endpoint}`, body ? JSON.stringify(body) : '');

  const response = await fetch(urlWithToken.toString(), options);
  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('[MetaAdsExecutor] API Error:', data.error);
    throw new Error(data.error?.message || `Meta API error: ${response.status}`);
  }

  return data;
}

/**
 * Get current status of an ad, adset, or campaign
 */
export async function getObjectStatus(
  objectId: string,
  objectType: 'ad' | 'adset' | 'campaign',
  credentials: MetaAdsCredentials
): Promise<{ status: string; effectiveStatus: string; name: string }> {
  const fields = 'status,effective_status,name';
  const data = await metaApiRequest(
    `/${objectId}?fields=${fields}`,
    'GET',
    credentials.accessToken
  );
  
  return {
    status: data.status,
    effectiveStatus: data.effective_status,
    name: data.name,
  };
}

/**
 * Pause an ad
 */
export async function pauseAd(
  adId: string,
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  try {
    // Get current state first
    const previousState = await getObjectStatus(adId, 'ad', credentials);
    
    if (previousState.status === 'PAUSED') {
      return {
        success: true,
        action: 'pause_ad',
        targetId: adId,
        targetType: 'ad',
        previousState,
        newState: previousState,
        metaApiResponse: { message: 'Ad already paused' },
      };
    }

    // Execute pause
    const response = await metaApiRequest(
      `/${adId}`,
      'POST',
      credentials.accessToken,
      { status: 'PAUSED' }
    );

    // Verify new state
    const newState = await getObjectStatus(adId, 'ad', credentials);

    console.log(`[MetaAdsExecutor] Ad ${adId} paused successfully`);

    return {
      success: true,
      action: 'pause_ad',
      targetId: adId,
      targetType: 'ad',
      previousState,
      newState,
      metaApiResponse: response,
    };
  } catch (error: any) {
    console.error(`[MetaAdsExecutor] Failed to pause ad ${adId}:`, error);
    return {
      success: false,
      action: 'pause_ad',
      targetId: adId,
      targetType: 'ad',
      error: error.message,
    };
  }
}

/**
 * Activate an ad
 */
export async function activateAd(
  adId: string,
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  try {
    const previousState = await getObjectStatus(adId, 'ad', credentials);
    
    if (previousState.status === 'ACTIVE') {
      return {
        success: true,
        action: 'activate_ad',
        targetId: adId,
        targetType: 'ad',
        previousState,
        newState: previousState,
        metaApiResponse: { message: 'Ad already active' },
      };
    }

    const response = await metaApiRequest(
      `/${adId}`,
      'POST',
      credentials.accessToken,
      { status: 'ACTIVE' }
    );

    const newState = await getObjectStatus(adId, 'ad', credentials);

    console.log(`[MetaAdsExecutor] Ad ${adId} activated successfully`);

    return {
      success: true,
      action: 'activate_ad',
      targetId: adId,
      targetType: 'ad',
      previousState,
      newState,
      metaApiResponse: response,
    };
  } catch (error: any) {
    console.error(`[MetaAdsExecutor] Failed to activate ad ${adId}:`, error);
    return {
      success: false,
      action: 'activate_ad',
      targetId: adId,
      targetType: 'ad',
      error: error.message,
    };
  }
}

/**
 * Pause an adset
 */
export async function pauseAdset(
  adsetId: string,
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  try {
    const previousState = await getObjectStatus(adsetId, 'adset', credentials);
    
    const response = await metaApiRequest(
      `/${adsetId}`,
      'POST',
      credentials.accessToken,
      { status: 'PAUSED' }
    );

    const newState = await getObjectStatus(adsetId, 'adset', credentials);

    console.log(`[MetaAdsExecutor] Adset ${adsetId} paused successfully`);

    return {
      success: true,
      action: 'pause_adset',
      targetId: adsetId,
      targetType: 'adset',
      previousState,
      newState,
      metaApiResponse: response,
    };
  } catch (error: any) {
    console.error(`[MetaAdsExecutor] Failed to pause adset ${adsetId}:`, error);
    return {
      success: false,
      action: 'pause_adset',
      targetId: adsetId,
      targetType: 'adset',
      error: error.message,
    };
  }
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(
  campaignId: string,
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  try {
    const previousState = await getObjectStatus(campaignId, 'campaign', credentials);
    
    const response = await metaApiRequest(
      `/${campaignId}`,
      'POST',
      credentials.accessToken,
      { status: 'PAUSED' }
    );

    const newState = await getObjectStatus(campaignId, 'campaign', credentials);

    console.log(`[MetaAdsExecutor] Campaign ${campaignId} paused successfully`);

    return {
      success: true,
      action: 'pause_campaign',
      targetId: campaignId,
      targetType: 'campaign',
      previousState,
      newState,
      metaApiResponse: response,
    };
  } catch (error: any) {
    console.error(`[MetaAdsExecutor] Failed to pause campaign ${campaignId}:`, error);
    return {
      success: false,
      action: 'pause_campaign',
      targetId: campaignId,
      targetType: 'campaign',
      error: error.message,
    };
  }
}

/**
 * Change adset daily budget
 */
export async function changeAdsetBudget(
  adsetId: string,
  newBudget: number, // In cents (Meta API uses cents)
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  try {
    // Get current budget
    const currentData = await metaApiRequest(
      `/${adsetId}?fields=daily_budget,name`,
      'GET',
      credentials.accessToken
    );

    const previousState = {
      daily_budget: currentData.daily_budget,
      name: currentData.name,
    };

    // Update budget
    const response = await metaApiRequest(
      `/${adsetId}`,
      'POST',
      credentials.accessToken,
      { daily_budget: newBudget }
    );

    // Verify new budget
    const newData = await metaApiRequest(
      `/${adsetId}?fields=daily_budget,name`,
      'GET',
      credentials.accessToken
    );

    const newState = {
      daily_budget: newData.daily_budget,
      name: newData.name,
    };

    console.log(`[MetaAdsExecutor] Adset ${adsetId} budget changed from ${previousState.daily_budget} to ${newState.daily_budget}`);

    return {
      success: true,
      action: 'change_budget',
      targetId: adsetId,
      targetType: 'adset',
      previousState,
      newState,
      metaApiResponse: response,
    };
  } catch (error: any) {
    console.error(`[MetaAdsExecutor] Failed to change adset budget ${adsetId}:`, error);
    return {
      success: false,
      action: 'change_budget',
      targetId: adsetId,
      targetType: 'adset',
      error: error.message,
    };
  }
}

/**
 * Change campaign daily budget
 */
export async function changeCampaignBudget(
  campaignId: string,
  newBudget: number, // In cents
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  try {
    const currentData = await metaApiRequest(
      `/${campaignId}?fields=daily_budget,name`,
      'GET',
      credentials.accessToken
    );

    const previousState = {
      daily_budget: currentData.daily_budget,
      name: currentData.name,
    };

    const response = await metaApiRequest(
      `/${campaignId}`,
      'POST',
      credentials.accessToken,
      { daily_budget: newBudget }
    );

    const newData = await metaApiRequest(
      `/${campaignId}?fields=daily_budget,name`,
      'GET',
      credentials.accessToken
    );

    const newState = {
      daily_budget: newData.daily_budget,
      name: newData.name,
    };

    console.log(`[MetaAdsExecutor] Campaign ${campaignId} budget changed from ${previousState.daily_budget} to ${newState.daily_budget}`);

    return {
      success: true,
      action: 'change_budget',
      targetId: campaignId,
      targetType: 'campaign',
      previousState,
      newState,
      metaApiResponse: response,
    };
  } catch (error: any) {
    console.error(`[MetaAdsExecutor] Failed to change campaign budget ${campaignId}:`, error);
    return {
      success: false,
      action: 'change_budget',
      targetId: campaignId,
      targetType: 'campaign',
      error: error.message,
    };
  }
}

/**
 * Rollback an action (restore previous state)
 */
export async function rollbackAction(
  executionResult: ExecutionResult,
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  if (!executionResult.previousState) {
    return {
      success: false,
      action: 'rollback',
      targetId: executionResult.targetId,
      targetType: executionResult.targetType,
      error: 'No previous state available for rollback',
    };
  }

  try {
    const { targetId, targetType, previousState, action } = executionResult;

    // Determine rollback action based on original action
    if (action === 'pause_ad' || action === 'activate_ad') {
      const response = await metaApiRequest(
        `/${targetId}`,
        'POST',
        credentials.accessToken,
        { status: previousState.status }
      );

      return {
        success: true,
        action: 'rollback',
        targetId,
        targetType,
        previousState: executionResult.newState,
        newState: previousState,
        metaApiResponse: response,
      };
    }

    if (action === 'change_budget') {
      const response = await metaApiRequest(
        `/${targetId}`,
        'POST',
        credentials.accessToken,
        { daily_budget: previousState.daily_budget }
      );

      return {
        success: true,
        action: 'rollback',
        targetId,
        targetType,
        previousState: executionResult.newState,
        newState: previousState,
        metaApiResponse: response,
      };
    }

    return {
      success: false,
      action: 'rollback',
      targetId,
      targetType,
      error: `Rollback not implemented for action: ${action}`,
    };
  } catch (error: any) {
    console.error(`[MetaAdsExecutor] Rollback failed:`, error);
    return {
      success: false,
      action: 'rollback',
      targetId: executionResult.targetId,
      targetType: executionResult.targetType,
      error: error.message,
    };
  }
}

/**
 * Execute a suggestion action based on action type
 */
export async function executeSuggestionAction(
  action: string,
  targetType: 'ad' | 'adset' | 'campaign',
  targetId: string,
  proposedState: any,
  credentials: MetaAdsCredentials
): Promise<ExecutionResult> {
  console.log(`[MetaAdsExecutor] Executing action: ${action} on ${targetType} ${targetId}`);

  switch (action) {
    case 'pause_ad':
      return pauseAd(targetId, credentials);
    
    case 'activate_ad':
      return activateAd(targetId, credentials);
    
    case 'pause_adset':
      return pauseAdset(targetId, credentials);
    
    case 'pause_campaign':
      return pauseCampaign(targetId, credentials);
    
    case 'scale_budget':
    case 'reduce_budget':
    case 'change_budget':
      if (targetType === 'adset') {
        return changeAdsetBudget(targetId, proposedState.daily_budget, credentials);
      } else if (targetType === 'campaign') {
        return changeCampaignBudget(targetId, proposedState.daily_budget, credentials);
      }
      return {
        success: false,
        action,
        targetId,
        targetType,
        error: `Budget change not supported for ${targetType}`,
      };
    
    default:
      console.warn(`[MetaAdsExecutor] Unknown action: ${action}`);
      return {
        success: false,
        action,
        targetId,
        targetType,
        error: `Unknown action: ${action}`,
      };
  }
}
