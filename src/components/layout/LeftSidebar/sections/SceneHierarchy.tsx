import { useState, useRef } from 'react';
import { Layers, Shapes, Type, Eye, EyeOff, Copy, Trash2, FolderOpen, Folder, FolderX, Edit3 } from 'lucide-react';
import { useVamsStore } from "@/stores";
import type { VamsObject } from "@/types";
import CollapsibleSection from './helpers/CollapsibleSection';

export default function SceneHierarchy() {
  const { 
    objects, 
    selectedObjectId, 
    setSelection, 
    deleteObject, 
    duplicateObject, 
    toggleObjectVisibility,
    createGroup,
    ungroup,
    deleteGroup,
    updateObjectName,
    reorderObject
  } = useVamsStore();

  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  // Drag and drop states
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getRootObjects = () => {
    return objects.filter(obj => !obj.parentId || !objects.find(o => o.id === obj.parentId));
  };

  const getChildren = (parentId: string) => {
    return objects.filter(obj => obj.parentId === parentId);
  };

  const toggleObjectSelection = (id: string) => {
    if (!isMultiSelectMode) {
      setSelection(id);
      return;
    }

    const newSelection = new Set(selectedObjects);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedObjects(newSelection);
  };

  const handleItemClick = (id: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    if (e.detail === 1) {
      clickTimerRef.current = setTimeout(() => {
        toggleObjectSelection(id);
      }, 200);
    } 
    else if (e.detail === 2) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      const obj = objects.find(o => o.id === id);
      if (obj) {
        setEditingId(id);
        setEditName(obj.textContent || obj.name);
      }
    }
  };

  const handleCreateGroup = () => {
    if (selectedObjects.size < 2) return;
    createGroup(Array.from(selectedObjects));
    setSelectedObjects(new Set());
    setIsMultiSelectMode(false);
  };

  const handleUngroup = (groupId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    ungroup(groupId);
  };

  const handleDeleteGroup = (groupId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    deleteGroup(groupId);
  };

  const renderObjectItem = (obj: VamsObject, depth: number = 0) => {
    const isGroup = obj.type === 'GROUP';
    const isSelected = isMultiSelectMode 
      ? selectedObjects.has(obj.id) 
      : selectedObjectId === obj.id;
    const children = isGroup ? getChildren(obj.id) : [];
    const isEditing = editingId === obj.id;

    let dragClass = '';
    if (dragOverId === obj.id && dragPosition) {
      dragClass = `drag-${dragPosition}`;
    }

    return (
      <li key={obj.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div 
          className={`tree-item ${isSelected ? 'selected' : ''} ${isGroup ? 'group-item' : ''} ${dragClass}`}
          draggable={!isEditing}
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer?.setData('text/plain', obj.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = rect.height;
            
            let pos: 'before' | 'after' | 'inside' = 'inside';
            
            if (isGroup) {
                if (y < h * 0.25) pos = 'before';
                else if (y > h * 0.75) pos = 'after';
                else pos = 'inside';
            } else {
                if (y < h * 0.5) pos = 'before';
                else pos = 'after';
            }

            setDragOverId(obj.id);
            setDragPosition(pos);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverId(null);
            setDragPosition(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceId = e.dataTransfer?.getData('text/plain');
            setDragOverId(null);
            setDragPosition(null);
            
            if (sourceId && sourceId !== obj.id && dragPosition) {
              reorderObject(sourceId, obj.id, dragPosition);
            }
          }}
          onClick={(e) => handleItemClick(obj.id, e)}
        >
          <span className="label">
            {isGroup ? (
              children.length > 0 ? <FolderOpen size={13} /> : <Folder size={13} />
            ) : obj.type === 'TEXT' ? (
              <Type size={13}/>
            ) : (
              <Shapes size={14}/>
            )}
            
            {isEditing ? (
              <input 
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.currentTarget.value)}
                onBlur={() => {
                  if (editName.trim()) updateObjectName(obj.id, editName.trim());
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editName.trim()) updateObjectName(obj.id, editName.trim());
                    setEditingId(null);
                  }
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid #3b82f6',
                  color: 'white',
                  borderRadius: '3px',
                  padding: '2px 4px',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  outline: 'none',
                  minWidth: 0
                }}
              />
            ) : (
              <span className="name" title="Double-click to rename">
                {obj.textContent || obj.name}
              </span>
            )}

            {isGroup && !isEditing && <span className="child-count">({children.length})</span>}
          </span>
          <div className="item-actions">
            {isGroup ? (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingId(obj.id); setEditName(obj.textContent || obj.name); }}
                  className="action-btn"
                  title="Rename Group">
                  <Edit3 size={14}/>
                </button>
                <button 
                  onClick={(e) => handleUngroup(obj.id, e)}
                  className="action-btn"
                  title="Ungroup">
                  <FolderOpen size={14}/>
                </button>
                <button 
                  onClick={(e) => handleDeleteGroup(obj.id, e)}
                  className="action-btn delete"
                  title="Delete Group & Children">
                  <FolderX size={14}/>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingId(obj.id); setEditName(obj.textContent || obj.name); }}
                  className="action-btn"
                  title="Rename">
                  <Edit3 size={14}/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleObjectVisibility(obj.id); }}
                  className="action-btn"
                  title={obj.isVisible ? 'Hide' : 'Show'}>
                  {obj.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }}
                  className="action-btn"
                  title="Duplicate">
                  <Copy size={14}/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }}
                  className="action-btn delete"
                  title="Delete">
                  <Trash2 size={14}/>
                </button>
              </>
            )}
          </div>
        </div>
        {isGroup && children.length > 0 && (
          <ul className="tree-list">
            {children.map(child => renderObjectItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const rootObjects = getRootObjects();

  return (
    <CollapsibleSection title="Scene Hierarchy" icon={<Layers size={14} />} defaultOpen={true}>
      <div className="group-controls">
        <button 
          onClick={() => {
            setIsMultiSelectMode(!isMultiSelectMode);
            setSelectedObjects(new Set());
          }}
          className={`control-btn ${isMultiSelectMode ? 'active' : ''}`}
          title="Multi-Select Mode"
        >
          {isMultiSelectMode ? 'Cancel Selection' : 'Multi-Select'}
        </button>
        {isMultiSelectMode && (
          <button 
            onClick={handleCreateGroup}
            disabled={selectedObjects.size < 2}
            className="control-btn group-btn"
            title="Create Group"
          >
            <Folder size={14} />
            <span>Group ({selectedObjects.size})</span>
          </button>
        )}
      </div>

      <ul className="tree-list">
        {rootObjects.map(obj => renderObjectItem(obj))}
        {rootObjects.length === 0 && <div className="empty-msg">Scene is empty</div>}
      </ul>
    </CollapsibleSection>
  );
}