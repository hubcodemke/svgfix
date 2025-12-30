<template>
  <div class="draggable-demo-container">
    <h3 class="demo-title">可拖拽元素示例</h3>
    <p class="demo-description">拖拽下面的元素查看效果</p>
    
    <div class="demo-area" ref="containerRef">
      <div 
        ref="draggableRef"
        class="draggable-element"
        :style="{
          transform: `translate(${x.value}px, ${y.value}px)`,
          transition: isDragging.value ? 'none' : 'transform 0.3s ease'
        }"
      >
        <svg 
          class="drag-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="5 9 2 12 5 15" />
          <polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" />
          <polyline points="19 9 22 12 19 15" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
        <span class="drag-text">拖拽我</span>
      </div>
    </div>
    
    <div class="demo-info">
      <p>拖拽状态: {{ isDragging.value ? '拖拽中' : '静止' }}</p>
      <p>位置: X={{ Math.round(x.value) }}px, Y={{ Math.round(y.value) }}px</p>
      <p>容器边界: 已限制在灰色区域内</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useDraggable } from '@vueuse/core';

// References for the draggable element and container
const draggableRef = ref(null);
const containerRef = ref(null);

// State for position and dragging status
const x = ref(0);
const y = ref(0);
const isDragging = ref(false);

// Store cleanup functions for proper cleanup
let cleanupFunctions = [];

const setupDraggable = () => {
  // Clear any existing cleanup functions
  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
  
  if (!draggableRef.value) {
    console.error('Draggable element not found');
    return;
  }
  
  // Use the useDraggable composable with boundary constraints
  const { x: posX, y: posY, isDragging: dragging } = useDraggable(draggableRef, {
    initialValue: { x: x.value, y: y.value },
    // Add boundary constraints if container exists
    onMove: (position) => {
      if (!containerRef.value || !draggableRef.value) return position;
      
      // Get container and element dimensions
      const containerRect = containerRef.value.getBoundingClientRect();
      const elementRect = draggableRef.value.getBoundingClientRect();
      
      // Calculate boundaries
      const maxX = containerRect.width - elementRect.width;
      const maxY = containerRect.height - elementRect.height;
      
      // Constrain the position within the container
      return {
        x: Math.max(0, Math.min(position.x, maxX)),
        y: Math.max(0, Math.min(position.y, maxY))
      };
    },
    onStart: () => {
      isDragging.value = true;
    },
    onEnd: () => {
      isDragging.value = false;
      // Save the final position
      x.value = posX.value;
      y.value = posY.value;
    }
  });
  
  // Update our local state
  x.value = posX.value;
  y.value = posY.value;
  isDragging.value = dragging.value;
  
  // Watch for changes in position and dragging status
  const unwatchX = posX.subscribe(newX => x.value = newX);
  const unwatchY = posY.subscribe(newY => y.value = newY);
  const unwatchDragging = dragging.subscribe(newDragging => isDragging.value = newDragging);
  
  // Store cleanup functions
  cleanupFunctions.push(unwatchX, unwatchY, unwatchDragging);
};

onMounted(() => {
  // Setup draggable functionality after components are mounted
  setupDraggable();
});

onUnmounted(() => {
  // Cleanup all event listeners and subscriptions
  cleanupFunctions.forEach(fn => fn());
});
</script>

<style scoped>
.draggable-demo-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.demo-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.demo-description {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px 0;
}

.demo-area {
  position: relative;
  width: 100%;
  height: 300px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.draggable-element {
  position: absolute;
  top: 0;
  left: 0;
  width: 120px;
  height: 120px;
  background: #6366f1;
  color: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: grab;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  user-select: none;
}

.draggable-element:active {
  cursor: grabbing;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.drag-icon {
  width: 32px;
  height: 32px;
}

.drag-text {
  font-size: 14px;
  font-weight: 500;
}

.demo-info {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.demo-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #475569;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .draggable-demo-container {
    background: #1e293b;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .demo-title {
    color: #f8fafc;
  }
  
  .demo-description {
    color: #cbd5e1;
  }
  
  .demo-area {
    background: #334155;
    border-color: #475569;
  }
  
  .demo-info {
    background: #334155;
    border-color: #475569;
  }
  
  .demo-info p {
    color: #cbd5e1;
  }
}
</style>
