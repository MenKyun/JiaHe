(function () {
  const curatedNames = {
    "TR-54805434847": "180cm 丟丟自動開腳自拍棒",
    "TR-50862649366": "磁吸半導體手機散熱器",
    "TR-43553081646": "M1 迷你磁吸自拍腳架",
    "TR-42379553092": "TOOREA 自拍棒收納袋",
    "TR-42052534861": "MagSafe 磁吸口袋補光燈",
    "TR-41868169513": "160cm 戶外插地三腳架",
    "TR-29555157903": "170cm 直播補光自拍腳架",
    "TR-28816260078": "180cm 不鏽鋼四腳自拍棒",
    "TR-28069464564": "180cm 冷靴口鋁合金自拍腳架",
    "TR-27773165390": "藍牙遙控器／補光燈配件",
    "TR-27418889395": "200cm 冷靴口直播自拍腳架",
    "TR-26718905013": "180cm 一體式藍牙自拍腳架",
    "TR-26221879038": "160cm 隱藏式鋁合金自拍腳架",
    "TR-25953040400": "180cm 雙機位磁吸四腳架",
    "TR-25909362486": "180cm 美顏燈四腳自拍棒",
    "TR-25707731457": "DSP 降噪無線領夾麥克風",
    "TR-25603173393": "三晶片降噪磁吸領夾麥克風",
    "TR-25166580960": "Type-C to Micro USB 麥克風轉接頭",
    "TR-25034418645": "LED 柔性直播補光燈",
    "TR-25026442730": "180cm 一鍵開腳四腳自拍棒",
    "TR-24753051489": "170cm 藍牙補光自拍腳架",
    "TR-24506704190": "三合一雙人無線領夾麥克風",
    "TR-23964294120": "磁吸紐扣型領夾麥克風",
    "TR-23689869022": "180cm AI 人臉追蹤自拍腳架",
    "TR-22988077996": "8 小時續航 DSP 無線麥克風",
    "TR-21796263087": "單軸防抖穩定器自拍棒"
  };

  const hiddenCatalogIds = new Set(["TR-25719911986"]);

  window.getCatalogProductName = function getCatalogProductName(product) {
    return curatedNames[product?.id] || product?.name || "未命名商品";
  };

  window.isCatalogProductVisible = function isCatalogProductVisible(product) {
    return Boolean(product?.id) && !hiddenCatalogIds.has(product.id);
  };
})();
