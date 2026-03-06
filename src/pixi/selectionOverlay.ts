import { Container, Graphics } from 'pixi.js';

export class SelectionOverlay extends Container {
    private border: Graphics;
    private target: Container | null = null;

    constructor() {
        super();
        this.border = new Graphics();
        this.addChild(this.border);
        this.eventMode = 'none'; 
    }

    public setTarget(target: Container | null) {
        this.target = target;
        if (!target) {
            this.border.clear();
            this.visible = false;
        } else {
            this.visible = true;
            this.update();
        }
    }

    public update() {
        if (!this.target || this.target.destroyed || !this.parent) {
            this.setTarget(null);
            return;
        }

        const target = this.target;
        
        // --- MATRIX-BASED POSITIONING ---
        // Logic: LocalTransform = Inverse(ParentWorldTransform) * TargetWorldTransform
        
        const relativeMatrix = target.worldTransform.clone();
        const parentMatrix = this.parent.worldTransform.clone();
        parentMatrix.invert();
        relativeMatrix.prepend(parentMatrix);
        
        // --- Manual Matrix Decomposition ---
        // Fixes: "Property 'transform' does not exist" by setting properties directly
        
        this.x = relativeMatrix.tx;
        this.y = relativeMatrix.ty;

        // Rotation
        this.rotation = Math.atan2(relativeMatrix.b, relativeMatrix.a);

        // Scale (handling skew/sign roughly for standard transforms)
        const sign = Math.sign(relativeMatrix.a * relativeMatrix.d - relativeMatrix.b * relativeMatrix.c);
        this.scale.x = Math.sqrt(relativeMatrix.a * relativeMatrix.a + relativeMatrix.b * relativeMatrix.b);
        this.scale.y = Math.sqrt(relativeMatrix.c * relativeMatrix.c + relativeMatrix.d * relativeMatrix.d) * sign;

        // Skew is typically handled by rotation in rigid transforms, 
        // but can be added if shearing is supported:
        this.skew.x = 0;
        this.skew.y = 0;

        // --- DRAWING ---
        // Get Untransformed Bounds
        const bounds = target.getLocalBounds();

        this.border.clear();
        
        const parentScale = this.parent ? Math.abs(this.parent.scale.x) : 1;
        const objectScale = Math.abs(this.scale.x) || 1; 
        
        // We want the line to be ~2px on screen
        const lineWidth = 2 / (parentScale * objectScale);
        const handleSize = 6 / (parentScale * objectScale);
        const lineColor = 0x0099ff;

        // DRAW BORDER (Stroke ONLY, No Fill)
        this.border.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.border.stroke({ width: lineWidth, color: lineColor });

        // DRAW HANDLES
        const half = handleSize / 2;
        const drawHandle = (x: number, y: number) => {
            this.border.rect(x - half, y - half, handleSize, handleSize);
            this.border.fill({ color: 0xffffff }); 
            this.border.stroke({ width: lineWidth, color: lineColor });
        };

        drawHandle(bounds.x, bounds.y); // TL
        drawHandle(bounds.x + bounds.width, bounds.y); // TR
        drawHandle(bounds.x + bounds.width, bounds.y + bounds.height); // BR
        drawHandle(bounds.x, bounds.y + bounds.height); // BL
    }
}