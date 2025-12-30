export function cleanSvgColors(svgContent, options = {}) {
  const {
    removeFill = true,
    removeStroke = true,
    removeColor = true,
    preserveBlack = false,
    preserveWhite = false,
    preserveTransparent = false
  } = options;

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
  elements.forEach(element => {
    colorAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr).toLowerCase();
        
        // 检查是否需要保留特定颜色
        let shouldPreserve = false;
        if (preserveBlack && (value === 'black' || value === '#000' || value === '#000000')) {
          shouldPreserve = true;
        } else if (preserveWhite && (value === 'white' || value === '#fff' || value === '#ffffff')) {
          shouldPreserve = true;
        } else if (preserveTransparent && (value === 'transparent' || value === 'none')) {
          shouldPreserve = true;
        }
        
        // 根据选项决定处理方式
        if (!shouldPreserve) {
          if (attr === 'fill' && removeFill) {
            // 设置fill为currentColor而非移除
            element.setAttribute(attr, 'currentColor');
          } else if (attr === 'stroke' && removeStroke) {
            // 设置stroke为currentColor而非移除
            element.setAttribute(attr, 'currentColor');
          } else if (attr === 'color' && removeColor) {
            element.removeAttribute(attr);
          } else if (['stop-color', 'flood-color', 'lighting-color'].includes(attr)) {
            element.removeAttribute(attr);
          }
        }
      } else {
        // 对于没有fill或stroke属性的元素，也可以考虑添加currentColor
        if ((attr === 'fill' && removeFill) || (attr === 'stroke' && removeStroke)) {
          // 只处理fill和stroke，不处理其他属性
          element.setAttribute(attr, 'currentColor');
        }
      }
    });
  });
  
  // 序列化回SVG字符串
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgDoc);
}

export function cleanSvgFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    // 在浏览器环境中，我们使用FileReader API来读取文件
    if (typeof window !== 'undefined' && window.FileReader) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const cleanedContent = cleanSvgColors(e.target.result, options);
          resolve(cleanedContent);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(filePath);
    } else {
      // 在Node.js环境中，我们使用fs模块来读取文件
      reject(new Error('File reading not supported in this environment'));
    }
  });
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
