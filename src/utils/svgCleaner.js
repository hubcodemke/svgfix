export function cleanSvgColors(svgContent) {
  // 创建DOMParser实例
  const parser = new DOMParser();
  // 解析SVG字符串为DOM
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  
  // 获取根元素
  const svgElement = svgDoc.documentElement;
  
  // 定义需要清理的颜色属性
  const colorAttributes = ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'];
  
  // 遍历所有元素
  const elements = svgDoc.querySelectorAll('*');
  
  // 统计图标类型
  let lineElementsCount = 0;
  let solidElementsCount = 0;
  
  elements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    // 跳过clipPath等特殊元素
    if (tagName === 'clippath' || tagName === 'clipPath' || tagName === 'defs' || tagName === 'style' || tagName === 'script') {
      return;
    }
    
    const hasStroke = element.hasAttribute('stroke');
    const strokeValue = element.getAttribute('stroke')?.toLowerCase() || '';
    const hasFill = element.hasAttribute('fill');
    const fillValue = element.getAttribute('fill')?.toLowerCase() || '';
    
    // 判断元素类型
    if (hasStroke && (fillValue === 'none' || !hasFill)) {
      // 线性元素：有stroke且fill为none或无fill
      lineElementsCount++;
    } else if (hasFill && (strokeValue === 'none' || !hasStroke)) {
      // 面性元素：有fill且stroke为none或无stroke
      solidElementsCount++;
    }
  });
  
  // 确定图标类型
  const isLineIcon = lineElementsCount > solidElementsCount;
  
  // 处理所有元素
  elements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    
    // 处理clipPath特殊情况
    if (tagName === 'clippath' || tagName === 'clipPath') {
      const rect = element.querySelector('rect');
      if (rect) {
        rect.removeAttribute('fill');
      }
      return;
    }
    
    // 跳过defs、style、script等特殊元素
    if (tagName === 'defs' || tagName === 'style' || tagName === 'script') {
      return;
    }
    
    colorAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr).toLowerCase();
        
        // 智能处理规则
        if (isLineIcon) {
          // 线性图标处理规则
          if (attr === 'fill') {
            // 确保fill="none"不变
            if (value !== 'none') {
              element.setAttribute(attr, 'none');
            }
          } else if (attr === 'stroke') {
            // 总是将stroke="#xxx"替换为stroke="currentColor"
            if (value !== 'none' && value !== 'currentcolor') {
              element.setAttribute(attr, 'currentColor');
            }
          } else if (['stop-color', 'flood-color', 'lighting-color'].includes(attr)) {
            element.removeAttribute(attr);
          }
        } else {
          // 面性图标处理规则
          if (attr === 'fill') {
            // 总是将fill="#xxx"替换为fill="currentColor"
            if (value !== 'none' && value !== 'currentcolor') {
              element.setAttribute(attr, 'currentColor');
            }
          } else if (attr === 'stroke') {
            // 总是将stroke="#xxx"替换为stroke="currentColor"
            if (value !== 'none' && value !== 'currentcolor') {
              element.setAttribute(attr, 'currentColor');
            }
          } else if (['stop-color', 'flood-color', 'lighting-color'].includes(attr)) {
            element.removeAttribute(attr);
          }
        }
      }
    });
  });
  
  // 序列化回SVG字符串
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgDoc);
}

export function isValidSvg(content) {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(content, 'image/svg+xml');
    const parserError = svgDoc.querySelector('parsererror');
    return !parserError;
  } catch (error) {
    return false;
  }
}
