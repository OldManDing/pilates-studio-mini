import Taro from '@tarojs/taro';

declare const WECHAT_SUBSCRIBE_TEMPLATE_IDS: string[];

interface SubscribeMessageResponse {
  errMsg?: string;
  [templateId: string]: string | undefined;
}

interface SubscribeMessageApi {
  requestSubscribeMessage?: (options: { tmplIds: string[] }) => Promise<SubscribeMessageResponse>;
}

export interface SubscribeAuthorizationResult {
  requested: boolean;
  acceptedTemplateIds: string[];
  rejectedTemplateIds: string[];
  unavailableReason?: string;
}

function getBookingSubscribeTemplateIds() {
  return Array.from(new Set((WECHAT_SUBSCRIBE_TEMPLATE_IDS || []).filter(Boolean)));
}

function isWeChatMiniProgramRuntime() {
  return process.env.TARO_ENV === 'weapp';
}

export async function requestBookingSubscribeAuthorization(): Promise<SubscribeAuthorizationResult> {
  const templateIds = getBookingSubscribeTemplateIds();

  if (!isWeChatMiniProgramRuntime()) {
    return {
      requested: false,
      acceptedTemplateIds: [],
      rejectedTemplateIds: [],
      unavailableReason: '当前运行环境不支持微信订阅消息授权',
    };
  }

  if (templateIds.length === 0) {
    return {
      requested: false,
      acceptedTemplateIds: [],
      rejectedTemplateIds: [],
      unavailableReason: '未配置微信订阅消息模板 ID',
    };
  }

  const subscribeApi = Taro as unknown as SubscribeMessageApi;
  if (typeof subscribeApi.requestSubscribeMessage !== 'function') {
    return {
      requested: false,
      acceptedTemplateIds: [],
      rejectedTemplateIds: templateIds,
      unavailableReason: '当前基础库不支持微信订阅消息授权',
    };
  }

  try {
    const result = await subscribeApi.requestSubscribeMessage({ tmplIds: templateIds });
    const acceptedTemplateIds = templateIds.filter((templateId) => result[templateId] === 'accept');

    return {
      requested: true,
      acceptedTemplateIds,
      rejectedTemplateIds: templateIds.filter((templateId) => !acceptedTemplateIds.includes(templateId)),
    };
  } catch {
    return {
      requested: true,
      acceptedTemplateIds: [],
      rejectedTemplateIds: templateIds,
    };
  }
}
