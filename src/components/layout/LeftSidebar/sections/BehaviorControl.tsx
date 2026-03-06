import { useState, useCallback } from 'react';
import { Activity, MousePointer, Trash2, Power, Zap } from 'lucide-react';
import { useVamsStore } from "@/stores";
import type { TriggerType, ActionType, VamsObject } from "@/types";
import CollapsibleSection from './helpers/CollapsibleSection';

export default function BehaviorControl() {
  const { objects, selectedObjectId, addBehavior, removeBehavior, updateBehavior } = useVamsStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  const [newTrigger, setNewTrigger] = useState<TriggerType>('KEY_PRESS');
  const [newParam, setNewParam] = useState<string>(''); // Key or Interval
  const [newCollisionTarget, setNewCollisionTarget] = useState<string>(''); // Target Object ID
  const [newAction, setNewAction] = useState<ActionType>('TRANSLATE_X');
  const [newValue, setNewValue] = useState<number>(0.1);
  const [newTextPayload, setNewTextPayload] = useState<string>('');
  const [newColorPayload, setNewColorPayload] = useState<string>('#ff0000');
  const [newTarget, setNewTarget] = useState<string>('OBJECT');

  const getAvailableCollisionTargets = useCallback((currentObj: VamsObject) => {
    return objects.filter(o => {
      if (o.id === currentObj.id) return false;
      if (currentObj.parentId) {
          if (o.id === currentObj.parentId) return false;
          if (o.parentId === currentObj.parentId) return false;
      }
      if (currentObj.type === 'GROUP') {
          if (o.parentId === currentObj.id) return false;
      }
      return true;
    });
  }, [objects]);

  if (!selectedObject) return null;

  const availableTargets = getAvailableCollisionTargets(selectedObject);
  const safeCollisionTarget = availableTargets.find(t => t.id === newCollisionTarget)
    ? newCollisionTarget
    : (availableTargets.length > 0 ? availableTargets[0].id : '');

  const isGroup = selectedObject.type === 'GROUP';
  const effectiveAction = (isGroup && newAction === 'SET_COLOR') ? 'TRANSLATE_X' : newAction;

  const isTargetFixed =
    isGroup ||
    selectedObject.vertices.length === 1 ||
    newTrigger === 'MOUSE_DRAG' ||
    newTrigger.includes('COLLISION') ||
    effectiveAction === 'ROTATE' ||
    effectiveAction === 'SCALE' ||
    effectiveAction === 'DESTROY' ||
    effectiveAction === 'GAME_OVER' ||
    effectiveAction === 'SET_COLOR';

  const isImmediateAction = (action: ActionType) =>
    action === 'DESTROY' || action === 'GAME_OVER' || action === 'SET_COLOR';

  const handleAddRule = () => {
    if (!selectedObject) return;
    if ((newTrigger === 'KEY_PRESS' || newTrigger === 'KEY_HOLD') && !newParam) return;
    if (newTrigger === 'ON_START' && !newParam && !isImmediateAction(effectiveAction)) return;
    if (newTrigger.includes('COLLISION') && !safeCollisionTarget) return;

    let finalTarget = newTarget;
    if (isGroup) finalTarget = 'GROUP';
    else if (isTargetFixed) finalTarget = 'OBJECT';

    addBehavior(selectedObject.id, {
      trigger: newTrigger,
      triggerKey: newParam.toLowerCase(),
      triggerTargetId: newTrigger.includes('COLLISION') ? safeCollisionTarget : undefined,
      action: effectiveAction,
      value: newValue,
      target: finalTarget,
      enabled: true,
      mode: 'INSTANT',
      textPayload: effectiveAction === 'GAME_OVER' ? newTextPayload : undefined,
      colorPayload: (effectiveAction === 'SET_COLOR' || effectiveAction === 'GAME_OVER') ? newColorPayload : undefined
    });

    if (newTrigger.includes('MOUSE')) {
      setNewParam('0');
    } else if (newTrigger.includes('COLLISION')) {
      setNewParam('100');
    } else if (newTrigger === 'ON_START') {
       setNewParam('100');
    } else {
      setNewParam('');
    }
  };

  const handleTriggerChange = (type: TriggerType) => {
    setNewTrigger(type);
    
    if (type === 'MOUSE_DRAG') {
        setNewAction('TRANSLATE_X');
        setNewValue(0);
        setNewTarget(isGroup ? 'GROUP' : 'OBJECT');
        setNewParam('0');
        return;
    }
    
    if (type === 'COLLISION_STAY' && (newAction === 'DESTROY' || newAction === 'GAME_OVER')) {
        setNewAction('TRANSLATE_X');
    }

    if (type.includes('MOUSE')) {
      setNewParam('0');
    } else if (type.includes('COLLISION')) {
      setNewParam('100');
    } else if (type === 'ON_START') {
      setNewParam('100');
    } else {
      setNewParam('');
    }

    if (type.includes('COLLISION')) {
      setNewTarget(isGroup ? 'GROUP' : 'OBJECT');
      setNewValue(0.1);
    } else {
      setNewValue(0.1);
    }
  };

  const renderTriggerInput = () => {
    if (newTrigger === 'ON_START') {
      const isImmediate = isImmediateAction(effectiveAction);
      return (
        <>
          {!isImmediate && (
            <div className="input-group">
                <label>Interval (ms)</label>
                <input
                    type="number"
                    className="input-sm"
                    value={newParam}
                    onChange={(e) => setNewParam(e.currentTarget.value)}
                    placeholder="100"
                />
            </div>
          )}
          {isImmediate && (
             <div className="input-group">
               <span className="static-value">
                 {effectiveAction === 'DESTROY' ? 'Destroyed' : 
                  effectiveAction === 'GAME_OVER' ? 'Ends Game' : 'Applied'} immediately on start
               </span>
             </div>
          )}
        </>
      );
    }

    if (newTrigger.includes('MOUSE')) {
      return (
        <div className="input-group">
            <label>Button</label>
            <select
                className="input-sm"
                value={newParam}
                onChange={(e) => setNewParam(e.currentTarget.value)}
            >
                <option value="0">Left Click</option>
                <option value="2">Right Click</option>
            </select>
        </div>
      );
    }

    if (newTrigger.includes('COLLISION')) {
      const isImmediate = isImmediateAction(effectiveAction);
      return (
        <>
            <div className="input-group">
                <label>Target</label>
                <select
                    className="select-flex"
                    value={safeCollisionTarget}
                    onChange={(e) => setNewCollisionTarget(e.currentTarget.value)}
                >
                {availableTargets.length === 0 && <option value="">No Objects</option>}
                {availableTargets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                ))}
                </select>
            </div>
            {!isImmediate && (
              <div className="input-group" style={{ marginTop: '8px' }}>
                  <label>Interval (ms)</label>
                  <input
                      type="number"
                      className="input-sm"
                      value={newParam}
                      onChange={(e) => setNewParam(e.currentTarget.value)}
                      placeholder="100"
                  />
              </div>
            )}
        </>
      );
    }

    return (
      <div className="input-group">
        <label>Key</label>
        <input
            type="text"
            placeholder="e.g. Space"
            className="input-sm"
            maxLength={1}
            value={newParam}
            onChange={(e) => setNewParam(e.currentTarget.value)}
        />
      </div>
    );
  };

  const renderActionInput = () => {
      if (effectiveAction === 'DESTROY' || newTrigger === 'MOUSE_DRAG') {
          return null;
      }

      if (effectiveAction === 'GAME_OVER') {
          return (
            <>
              <div className="input-group">
                  <label>Message</label>
                  <input
                      type="text"
                      className="input-sm"
                      value={newTextPayload}
                      onChange={(e) => setNewTextPayload(e.currentTarget.value)}
                      placeholder="You Died!"
                  />
              </div>
              <div className="input-group" style={{ marginTop: '8px' }}>
                  <label>Color</label>
                  <input
                      type="color"
                      className="input-color-block"
                      value={newColorPayload}
                      onChange={(e) => setNewColorPayload(e.currentTarget.value)}
                  />
              </div>
            </>
          );
      }

      if (effectiveAction === 'SET_COLOR') {
          return (
            <div className="input-group">
                <label>Color</label>
                <input
                    type="color"
                    className="input-color-block"
                    value={newColorPayload}
                    onChange={(e) => setNewColorPayload(e.currentTarget.value)}
                />
            </div>
          );
      }

      return (
        <div className="input-group">
            <label>Value</label>
            <input
                type="number"
                step={0.1}
                className="input-sm"
                value={newValue}
                onChange={(e) => setNewValue(parseFloat(e.currentTarget.value) || 0)}
            />
        </div>
      );
  };

  const getTriggerLabel = (t: TriggerType) => {
      switch(t) {
          case 'ON_START': return 'Always / On Start';
          case 'COLLISION_START': return 'On Hit (Once)';
          case 'COLLISION_STAY': return 'While Touching';
          case 'KEY_PRESS': return 'Key Press';
          case 'KEY_HOLD': return 'Key Hold';
          case 'MOUSE_CLICK': return 'Mouse Click';
          case 'MOUSE_DRAG': return 'Mouse Drag';
          default: return t;
      }
  };

  const getActionLabel = (a: ActionType) => {
      switch(a) {
          case 'TRANSLATE_X': return 'Move X';
          case 'TRANSLATE_Y': return 'Move Y';
          case 'ROTATE': return 'Rotate';
          case 'SCALE': return 'Resize';
          case 'DESTROY': return 'Destroy Object';
          case 'SET_COLOR': return 'Set Color';
          case 'GAME_OVER': return 'End Game';
          default: return a;
      }
  };

  return (
    <CollapsibleSection title="Behavior Rules" icon={<Activity size={14} />} defaultOpen={true}>
      <div className="behavior-section">
        
        <div className="rules-block-builder">
            <div className="block-header">Create New Rule</div>
            
            <div className="block-row">
                <span className="label-col">WHEN:</span>
                <select
                    className="select-flex"
                    value={newTrigger}
                    onChange={(e) => handleTriggerChange(e.currentTarget.value as TriggerType)}
                >
                    <option value="KEY_PRESS">Key Press</option>
                    <option value="KEY_HOLD">Key Hold</option>
                    <option value="ON_START">Always / On Start</option>
                    <option value="MOUSE_CLICK">Mouse Click</option>
                    <option value="MOUSE_DRAG">Mouse Drag</option>
                    <option value="COLLISION_START">On Hit (Once)</option>
                    <option value="COLLISION_STAY">While Touching</option>
                </select>
            </div>
            <div className="block-param-row">
                {renderTriggerInput()}
            </div>

            <div className="separator" />

            <div className="block-row">
                <span className="label-col">THEN:</span>
                {newTrigger === 'MOUSE_DRAG' ? (
                    <span className="static-value">Move Position (X,Y)</span>
                ) : (
                    <select
                        className="select-flex"
                        value={effectiveAction}
                        onChange={(e) => setNewAction(e.currentTarget.value as ActionType)}
                    >
                        <option value="TRANSLATE_X">Move X</option>
                        <option value="TRANSLATE_Y">Move Y</option>
                        <option value="ROTATE">Rotate</option>
                        <option value="SCALE">Resize</option>
                        {!isGroup && <option value="SET_COLOR">Set Color</option>}
                        {/* Hide Destroy/Game Over for continuous collision to prevent spam */}
                        {newTrigger !== 'COLLISION_STAY' && <option value="DESTROY">Destroy Object</option>}
                        {newTrigger !== 'COLLISION_STAY' && <option value="GAME_OVER">End Game</option>}
                    </select>
                )}
            </div>
            <div className="block-param-row">
                {renderActionInput()}
            </div>

            {!isTargetFixed && (
                <>
                <div className="separator" />
                <div className="block-row">
                    <span className="label-col">TARGET:</span>
                    <select className="select-flex" value={newTarget} onChange={(e) => setNewTarget(e.currentTarget.value)}>
                        <option value="OBJECT">Whole Object</option>
                        {selectedObject.vertices.map((v, i) => (
                        <option key={v.id} value={v.id}>Vertex {i} ({v.id})</option>
                        ))}
                    </select>
                </div>
                </>
            )}

            <button className="add-btn-block" onClick={handleAddRule}>
                + Add Behavior Rule
            </button>
        </div>

        <div className="active-rules-list">
          {selectedObject.behaviors.map((b) => {
              const targetName = objects.find(o => o.id === b.triggerTargetId)?.name || 'Unknown';
              return (
                <div className={`rule-card ${!b.enabled ? 'disabled' : ''}`} key={b.id}>
                    <div className="card-header">
                        <span className="trigger-badge">{getTriggerLabel(b.trigger)}</span>
                        <div className="card-controls">
                            <button 
                                className="icon-btn" 
                                onClick={() => updateBehavior(selectedObject.id, b.id, { enabled: !b.enabled })}
                                title="Toggle Rule"
                            >
                                <Power size={14} />
                            </button>
                            <button className="icon-btn" onClick={() => removeBehavior(selectedObject.id, b.id)} title="Delete Rule">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="detail-row">
                            <Zap className="icon-muted" />
                            <span>
                                {b.trigger === 'KEY_PRESS' || b.trigger === 'KEY_HOLD' ? `Key: '${b.triggerKey.toUpperCase()}'` : ''}
                                {b.trigger === 'ON_START' ? (isImmediateAction(b.action) ? 'Immediately' : `Every ${b.triggerKey}ms`) : ''}
                                {b.trigger.includes('MOUSE') ? `Button: ${b.triggerKey === '2' ? 'Right' : 'Left'}` : ''}
                                {b.trigger.includes('COLLISION') ? (isImmediateAction(b.action) ? `With: ${targetName}` : `With: ${targetName} (${b.triggerKey}ms)`) : ''}
                            </span>
                        </div>
                        <div className="detail-row highlight">
                            <Activity className="icon-muted" />
                            <span>
                                {b.trigger === 'MOUSE_DRAG' 
                                    ? 'Move (X, Y)' 
                                    : getActionLabel(b.action)
                                }
                                {b.action === 'GAME_OVER' && `: "${b.textPayload}"`}
                                {(b.action === 'SET_COLOR' || b.action === 'GAME_OVER') && b.colorPayload && (
                                  <span className="color-swatch" style={{backgroundColor: b.colorPayload}}></span>
                                )}
                                {b.action !== 'DESTROY' && b.action !== 'GAME_OVER' && b.action !== 'SET_COLOR' && b.trigger !== 'MOUSE_DRAG' && ` (${b.value})`}
                            </span>
                        </div>
                        {b.target !== 'OBJECT' && b.target !== 'GROUP' && (
                             <div className="detail-row">
                                <MousePointer className="icon-muted" />
                                <span className="target-text">Vertex: {b.target}</span>
                             </div>
                        )}
                    </div>
                </div>
              );
          })}
          {selectedObject.behaviors.length === 0 && (
            <div className="no-behavior">No behaviors added</div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}