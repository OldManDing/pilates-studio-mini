const CHINESE_TEXT_PATTERN = /[\u4e00-\u9fff]/;

const ERROR_MESSAGE_RULES: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /hideLoading:fail|toast can't be found/i,
    message: '页面加载状态已结束',
  },
  {
    pattern: /missing wechat pay config|wechat\.appid|wechat pay config|payment config/i,
    message: '支付通道配置暂不可用，请联系门店处理',
  },
  {
    pattern: /wechat pay did not return prepay_id|wechat pay request failed/i,
    message: '微信支付下单失败，请稍后重试或联系门店',
  },
  {
    pattern: /mini user openid is required for wechat pay|openid is required/i,
    message: '微信支付身份信息缺失，请重新登录后再试',
  },
  {
    pattern: /mock payment completion is only available in mock mode/i,
    message: '模拟支付仅在测试模式可用，请联系门店处理',
  },
  {
    pattern: /payment amount does not match transaction amount/i,
    message: '支付金额校验失败，请联系门店处理',
  },
  {
    pattern: /missing wechat pay signature headers|invalid wechat pay signature/i,
    message: '微信支付回调校验失败，请联系门店处理',
  },
  {
    pattern: /current membership has not expired.*same-plan renewal/i,
    message: '当前会籍未到期，仅支持同方案续费',
  },
  {
    pattern: /member profile not found|member not found/i,
    message: '未找到会员档案，请联系门店同步会员信息',
  },
  {
    pattern: /mini user id is required|member id is required/i,
    message: '账号信息缺失，请重新登录后再试',
  },
  {
    pattern: /cannot create booking for another member|cannot access another member booking|cannot cancel another member booking|cannot check in another member booking/i,
    message: '当前账号不能操作其他会员记录',
  },
  {
    pattern: /active membership plan not found|membership plan not found/i,
    message: '会员方案暂不可用，请刷新后重试',
  },
  {
    pattern: /mini user not found|mini user is disabled/i,
    message: '微信用户状态异常，请重新登录或联系门店',
  },
  {
    pattern: /requestPayment:fail.*cancel|cancel payment|user cancel/i,
    message: '已取消支付',
  },
  {
    pattern: /requestPayment:fail.*(parameter|timeStamp|nonceStr|package|paySign)|payment params?/i,
    message: '微信支付参数异常，请联系门店处理',
  },
  {
    pattern: /requestPayment:fail/i,
    message: '微信支付暂不可用，请稍后重试或联系门店',
  },
  {
    pattern: /session is not open for booking|not open for booking/i,
    message: '该场次暂未开放预约，请返回课程列表选择其他场次',
  },
  {
    pattern: /session is fully booked|fully booked/i,
    message: '该场次已约满，请选择其他场次',
  },
  {
    pattern: /member already booked for this session|already booked/i,
    message: '你已预约该场次，请勿重复预约',
  },
  {
    pattern: /cannot update a cancelled booking|cannot delete a completed booking|cannot check in a cancelled or no-show booking/i,
    message: '当前预约状态不可执行该操作',
  },
  {
    pattern: /cannot update a completed booking/i,
    message: '已完成的预约不可修改',
  },
  {
    pattern: /booking was updated concurrently|please retry/i,
    message: '预约状态刚刚更新，请刷新后重试',
  },
  {
    pattern: /unable to generate a unique booking code/i,
    message: '预约编号生成失败，请稍后重试',
  },
  {
    pattern: /member is not active|membership has expired/i,
    message: '会员状态暂不可预约，请先续费或联系门店',
  },
  {
    pattern: /member does not have an active membership plan/i,
    message: '当前账号尚未开通有效会员方案',
  },
  {
    pattern: /insufficient remaining credits/i,
    message: '剩余课次不足，请先续费后再预约',
  },
  {
    pattern: /course session not found|booking not found|transaction not found/i,
    message: '相关记录不存在或已更新，请刷新后重试',
  },
  {
    pattern: /code is required|failed to exchange wechat code|wechat app credentials are not configured/i,
    message: '微信登录凭证无效，请重新登录后再试',
  },
  {
    pattern: /phone must be a valid contact number/i,
    message: '手机号格式不正确，请联系门店核实',
  },
  {
    pattern: /phone number already registered/i,
    message: '该手机号已注册，请联系门店核实',
  },
  {
    pattern: /remaining credits cannot be negative/i,
    message: '剩余课次不能为负数',
  },
  {
    pattern: /unauthorized|invalid token|token expired|\b401\b/i,
    message: '登录已过期，请重新登录',
  },
  {
    pattern: /forbidden|\b403\b/i,
    message: '暂无权限执行此操作',
  },
  {
    pattern: /not found|\b404\b/i,
    message: '数据不存在或已下架',
  },
  {
    pattern: /bad request|validation failed|\b400\b/i,
    message: '提交信息有误，请检查后重试',
  },
  {
    pattern: /internal server error|\b500\b|server error/i,
    message: '服务暂时异常，请稍后重试',
  },
  {
    pattern: /network error|failed to fetch/i,
    message: '网络连接失败，请检查网络',
  },
  {
    pattern: /timeout|timed out/i,
    message: '请求超时，请稍后重试',
  },
];

export function localizeErrorMessage(message: unknown, fallback = '操作失败，请稍后重试') {
  const rawMessage = typeof message === 'string' ? message.trim() : '';

  if (!rawMessage) {
    return fallback;
  }

  if (CHINESE_TEXT_PATTERN.test(rawMessage)) {
    return rawMessage;
  }

  const matchedRule = ERROR_MESSAGE_RULES.find((rule) => rule.pattern.test(rawMessage));
  return matchedRule?.message || fallback;
}

export function getLocalizedErrorMessage(error: unknown, fallback = '操作失败，请稍后重试') {
  if (error instanceof Error) {
    return localizeErrorMessage(error.message, fallback);
  }

  if (typeof error === 'string') {
    return localizeErrorMessage(error, fallback);
  }

  const errMsg = (error as { errMsg?: unknown } | null)?.errMsg;
  return localizeErrorMessage(errMsg, fallback);
}
