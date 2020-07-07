export interface DistanceOption {
  startCartesian: object;
  endCartesian: object;
  total: number;
  clampToGround: boolean;
}

/**
 * InfoDisplay.ts
 */
// export interface DisplayOption {
//   titleClass: string;
//   contentClass: string;
//   closeClass: string;
// }

// export interface TemplateObjOption {
//   htmlContent: string; // html具体代码
//   opts: DisplayOption;
// }

// 用户注册box时传入的参数
export interface RegPropOption {
  title?: string;
  content?: string;
  template?: string;
}

// export interface RegisBoxOption {
//   title: string;
//   content: string;
//   template: string;
// }

export interface EntityRegMsgOption {
  title?: string;
  content?: string;
  template?: string;
  entity: any;
}

// infoBox样式内容
export interface InfoBoxStyleOption {
  infoBox: object;
  infoTitle: object;
  infoContent: object;
}

// floatBox样式内容
export interface FloatBoxStyleOption {
  floatBox: object;
  floatTitle: object;
  floatContent: object;
}
