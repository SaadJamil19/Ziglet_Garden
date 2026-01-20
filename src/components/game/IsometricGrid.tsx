import { useApplication, useTick } from "@pixi/react";
import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import gsap from "gsap";
import { gridToScreen } from "../../utils/isometric";
import { GAME_CONFIG } from "../../constants/config";

interface GridProps {
  offsetX?: number;
  offsetY?: number;
  isWatering?: boolean;
  growthPoints?: number;
}

// --- ASSETS ---
const createWateringCan = (scale = 1) => {
  const can = new PIXI.Container();
  const body = new PIXI.Graphics();
  body.beginFill(0x90a4ae);
  body.drawRoundedRect(-6 * scale, -6 * scale, 12 * scale, 10 * scale, 2);
  body.endFill();
  can.addChild(body);
  const spout = new PIXI.Graphics();
  spout.beginFill(0x78909c);
  spout.moveTo(6 * scale, -2 * scale);
  spout.lineTo(14 * scale, -6 * scale);
  spout.lineTo(14 * scale, -4 * scale);
  spout.lineTo(6 * scale, 1 * scale);
  spout.endFill();
  can.addChild(spout);
  const handle = new PIXI.Graphics();
  handle.lineStyle(2 * scale, 0x546e7a);
  handle.arc(-4 * scale, -6 * scale, 6 * scale, Math.PI, 0);
  can.addChild(handle);
  return { container: can, spoutTip: { x: 14 * scale, y: -5 * scale } };
};

const createWoodenFence = (length: number, scale = 1) => {
  const container = new PIXI.Container();
  const postColor = 0x5d4037;
  const railColor = 0x8d6e63;

  // Slight overlap
  const railL = length + 4;
  const railH = 6 * scale;
  const postH = 24 * scale;
  const postW = 6 * scale;

  // Draw Post (Centered at origin)
  const drawPost = () => {
    const post = new PIXI.Graphics();
    post.beginFill(0x000000, 0.3); // Shadow
    post.drawEllipse(0, 0, 8 * scale, 4 * scale);
    post.endFill();
    post.beginFill(postColor);
    post.drawRect(-postW / 2, -postH, postW, postH);
    post.endFill();
    post.beginFill(0x4e342e); // Top cap
    post.drawRect(-postW / 2, -postH, postW, 3 * scale);
    post.endFill();
    return post;
  };

  // Draw Rail (Use length)
  const drawRail = (yOffset: number) => {
    const rail = new PIXI.Graphics();
    rail.beginFill(railColor);
    rail.drawRect(-railL / 2, yOffset, railL, railH);
    rail.endFill();
    rail.beginFill(0x000000, 0.1);
    rail.drawRect(-railL / 2, yOffset + 2, railL, 2);
    rail.endFill();
    return rail;
  };

  // Construct Segment
  // A segment is 1 rail + 1 post at the end?
  // Or center-based? Let's do Center-based rail logic.
  container.addChild(drawPost()); // Center Post
  // For contiguous fences, we usually place a post at every vertex.
  // The rail goes from this post to the next.
  // But `createWoodenFence` is called for "edges".
  // Let's make this function just return a Rail Segment + End Post?

  // Actually, best "farm" look is: Post at every Corner/Junction. Rails between.
  // My previous logic was instantiating posts and rails together.

  container.addChild(drawRail(-12 * scale));
  container.addChild(drawRail(-20 * scale));

  return container;
};

// Simple vertical post for corners
const createCornerPost = (scale = 1) => {
  const postColor = 0x5d4037;
  const postH = 26 * scale;
  const postW = 8 * scale;
  const g = new PIXI.Graphics();
  g.beginFill(0x000000, 0.3);
  g.drawEllipse(0, 0, 10 * scale, 5 * scale);
  g.endFill();
  g.beginFill(postColor);
  g.drawRect(-postW / 2, -postH, postW, postH);
  g.endFill();
  g.beginFill(0x3e2723);
  g.drawRect(-postW / 2, -postH, postW, 3 * scale);
  g.endFill();
  return g;
};

const createCharacter = () => {
  const container = new PIXI.Container();
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.25);
  shadow.drawEllipse(0, 0, 12, 6);
  shadow.endFill();
  container.addChild(shadow);

  const rig = new PIXI.Container();
  rig.scale.set(1.7);
  container.addChild(rig);

  const hat = new PIXI.Graphics();
  hat.beginFill(0xf6b51a);
  hat.drawRect(-7, -22, 14, 2);
  hat.drawRect(-4, -26, 8, 4);
  hat.endFill();
  rig.addChild(hat);

  const head = new PIXI.Graphics();
  head.beginFill(0xffd39a);
  head.drawRect(-3, -20, 6, 6);
  head.endFill();
  rig.addChild(head);

  const eyes = new PIXI.Graphics();
  eyes.beginFill(0x3e2723);
  eyes.drawRect(-2, -18, 1, 1);
  eyes.drawRect(1, -18, 1, 1);
  eyes.endFill();
  rig.addChild(eyes);

  const arms = new PIXI.Graphics();
  arms.beginFill(0xffd39a);
  arms.drawRect(-6, -14, 2, 6);
  arms.drawRect(4, -14, 2, 6);
  arms.endFill();
  rig.addChild(arms);

  const shirt = new PIXI.Graphics();
  shirt.beginFill(0x90caf9);
  shirt.drawRect(-4, -14, 8, 4);
  shirt.endFill();
  rig.addChild(shirt);

  const body = new PIXI.Graphics();
  body.beginFill(0x1976d2);
  body.drawRect(-4, -10, 8, 8);
  body.endFill();
  rig.addChild(body);

  const belt = new PIXI.Graphics();
  belt.beginFill(0x0d47a1);
  belt.drawRect(-4, -6, 8, 2);
  belt.endFill();
  rig.addChild(belt);

  const pants = new PIXI.Graphics();
  pants.beginFill(0x0d47a1);
  pants.drawRect(-4, -4, 8, 6);
  pants.endFill();
  rig.addChild(pants);

  const boots = new PIXI.Graphics();
  boots.beginFill(0x263238);
  boots.drawRect(-4, 2, 3, 2);
  boots.drawRect(1, 2, 3, 2);
  boots.endFill();
  rig.addChild(boots);

  return { container, sprite: rig };
};

const createHighQualityTree = (
  size: "small" | "medium" | "large" = "medium"
) => {
  const container = new PIXI.Container();
  const config = {
    small: { scale: 0.75, heightOffset: 0 },
    medium: { scale: 0.95, heightOffset: 8 },
    large: { scale: 1.25, heightOffset: 16 },
  };
  const { scale, heightOffset } = config[size];
  const trunkColor = 0x5d4037;
  const shadowColor = 0x000000;
  const foliagePalette = [0x1b5e20, 0x2e7d32, 0x43a047, 0x66bb6a];
  const shadow = new PIXI.Graphics();
  shadow.beginFill(shadowColor, 0.2);
  shadow.drawEllipse(0, 0, 26 * scale, 13 * scale);
  shadow.endFill();
  container.addChild(shadow);
  const trunkBaseH = 22 * scale;
  const totalTrunkH = trunkBaseH + heightOffset;
  const trunk = new PIXI.Graphics();
  trunk.beginFill(trunkColor);
  trunk.moveTo(-7 * scale, -5 * scale);
  trunk.lineTo(7 * scale, -5 * scale);
  trunk.lineTo(5 * scale, -totalTrunkH);
  trunk.lineTo(-5 * scale, -totalTrunkH);
  trunk.endFill();
  trunk.beginFill(0x3e2723, 0.5);
  trunk.drawRect(2 * scale, -totalTrunkH, 3 * scale, totalTrunkH - 5 * scale);
  trunk.endFill();
  container.addChild(trunk);
  const foliage = new PIXI.Graphics();
  const baseY = -32 * scale - heightOffset;
  foliage.beginFill(foliagePalette[0]);
  foliage.drawEllipse(0, baseY + 6 * scale, 28 * scale, 16 * scale);
  foliage.endFill();
  foliage.beginFill(foliagePalette[1]);
  foliage.drawCircle(-14 * scale, baseY, 16 * scale);
  foliage.drawCircle(14 * scale, baseY, 16 * scale);
  foliage.drawEllipse(0, baseY + 2 * scale, 20 * scale, 14 * scale);
  foliage.endFill();
  foliage.beginFill(foliagePalette[2]);
  foliage.drawCircle(0, baseY - 12 * scale, 18 * scale);
  foliage.drawEllipse(-12 * scale, baseY - 5 * scale, 10 * scale, 6 * scale);
  foliage.drawEllipse(12 * scale, baseY - 5 * scale, 10 * scale, 6 * scale);
  foliage.endFill();
  foliage.beginFill(foliagePalette[3]);
  foliage.drawEllipse(-5 * scale, baseY - 18 * scale, 10 * scale, 6 * scale);
  foliage.endFill();
  container.addChild(foliage);
  return container;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const offsetColor = (color: number, offset: number) => {
  const r = clamp(((color >> 16) & 0xff) + offset, 0, 255);
  const g = clamp(((color >> 8) & 0xff) + offset, 0, 255);
  const b = clamp((color & 0xff) + offset, 0, 255);
  return (r << 16) | (g << 8) | b;
};

interface GrassBladeSprite {
  sprite: PIXI.Container;
  baseScaleX: number;
  baseScaleY: number;
}

interface GrassTileData {
  toneOffset: number;
  row: number;
  col: number;
  baseX: number;
  baseY: number;
  blades: GrassBladeSprite[];
  growth: number;
  target: number;
  isWatered: boolean;
}

const createGardenBase = (
  rows: number,
  cols: number,
  tileWidth: number,
  tileHeight: number
) => {
  const base = new PIXI.Graphics();
  const top = gridToScreen(0, 0, tileWidth, tileHeight);
  const right = gridToScreen(0, cols, tileWidth, tileHeight);
  const bottom = gridToScreen(rows, cols, tileWidth, tileHeight);
  const left = gridToScreen(rows, 0, tileWidth, tileHeight);

  base.beginFill(0x6a9252);
  base.moveTo(top.x, top.y);
  base.lineTo(right.x, right.y);
  base.lineTo(bottom.x, bottom.y);
  base.lineTo(left.x, left.y);
  base.lineTo(top.x, top.y);
  base.endFill();

  base.lineStyle(3, 0x4e7240, 0.35);
  base.moveTo(top.x, top.y);
  base.lineTo(right.x, right.y);
  base.lineTo(bottom.x, bottom.y);
  base.lineTo(left.x, left.y);
  base.lineTo(top.x, top.y);
  base.lineStyle(0);

  return base;
};

const randomPointInDiamond = (
  tileWidth: number,
  tileHeight: number
) => {
  const halfWidth = tileWidth / 2;
  const halfHeight = tileHeight / 2;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < 8; i += 1) {
    dx = (Math.random() - 0.5) * tileWidth;
    dy = (Math.random() - 0.5) * tileHeight;
    if (Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight <= 1) {
      break;
    }
  }
  return { dx, dy: dy + halfHeight };
};

const createGrassBlade = (
  x: number,
  y: number,
  toneOffset: number,
  texture?: PIXI.Texture | null
) => {
  if (texture) {
    const blade = new PIXI.Sprite(texture);
    blade.anchor.set(0.5, 1);
    blade.tint = offsetColor(0x63c648, toneOffset);
    blade.alpha = 0.92;
    blade.scale.set(0.1 + Math.random() * 0.05);
    blade.x = x;
    blade.y = y;
    blade.rotation = ((Math.random() * 10 - 5) * Math.PI) / 180;
    return blade;
  }

  const blade = new PIXI.Graphics();
  const height = 10 + Math.random() * 16;
  const width = 3 + Math.random() * 4;
  const color = offsetColor(0x63c648, toneOffset);
  blade.beginFill(color, 1);
  blade.moveTo(0, 0);
  blade.lineTo(-width * 0.5, -height);
  blade.lineTo(0, -height * 1.15);
  blade.lineTo(width * 0.5, -height);
  blade.lineTo(0, 0);
  blade.endFill();
  blade.tint = color;
  blade.x = x;
  blade.y = y;
  blade.rotation = ((Math.random() * 10 - 5) * Math.PI) / 180;
  return blade;
};


export const IsometricGrid = ({
  offsetX = 0,
  offsetY = 0,
  isWatering = false,
  growthPoints = 0,
}: GridProps) => {
  const appState = useApplication();
  const app = appState?.app;
  const { rows, cols, tileWidth, tileHeight } = GAME_CONFIG.grid;

  const characterRef = useRef<PIXI.Container | null>(null);
  const characterSpriteRef = useRef<PIXI.Container | null>(null);
  const wateringCanRef = useRef<PIXI.Container | null>(null);
  const tilesRef = useRef<GrassTileData[]>([]);
  const tilesByKeyRef = useRef<Map<string, GrassTileData>>(new Map());
  const orderedTilesRef = useRef<GrassTileData[]>([]);
  const filledTilesRef = useRef(0);
  const grassLayerRef = useRef<PIXI.Container | null>(null);
  const grassBladeTextureRef = useRef<PIXI.Texture | null>(null);
  const visitWateredRef = useRef(false);
  const windTweensRef = useRef<gsap.core.Tween[]>([]);
  const treeTweensRef = useRef<gsap.core.Tween[]>([]);
  // FINITE STATE MACHINE:
  const animationState = useRef<
    "idle" | "walking_to" | "watering" | "returning"
  >("idle");
  const animationTimer = useRef(0); // For timing watering duration

  const targetPos = useRef<{ x: number; y: number } | null>(null);
  const targetTileRef = useRef<{ row: number; col: number } | null>(null);
  const centerPos = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<PIXI.Container | null>(null);
  const wateringTipRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef(0);
  const moveTweenRef = useRef<gsap.core.Tween | null>(null);
  const waveTweenRef = useRef<gsap.core.Tween | null>(null);
  const idleTweenRef = useRef<gsap.core.Tween | null>(null);
  const wateringAudioRef = useRef<HTMLAudioElement | null>(null);
  const grassGrowAudioRef = useRef<HTMLAudioElement | null>(null);

const addGrassBladesToTile = (tile: GrassTileData, count: number) => {
    if (!grassLayerRef.current) return;
    const clumps = Math.max(4, Math.round(count / 3));
    for (let c = 0; c < clumps; c += 1) {
      const { dx: cx, dy: cy } = randomPointInDiamond(tileWidth, tileHeight);
      const bladesInClump = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < bladesInClump; i += 1) {
        const jitterX = (Math.random() - 0.5) * 34;
        const jitterY = (Math.random() - 0.5) * 22;
        const { dx, dy } = { dx: cx + jitterX, dy: cy + jitterY };
      const blade = createGrassBlade(
        tile.baseX + dx,
        tile.baseY + dy,
        tile.toneOffset,
        grassBladeTextureRef.current
      );
      blade.zIndex = blade.y;
      grassLayerRef.current.addChild(blade);
      const bladeEntry = {
        sprite: blade,
        baseScaleX: blade.scale.x,
        baseScaleY: blade.scale.y,
      };
      tile.blades.push(bladeEntry);

      const sway =
        ((Math.random() * 6 + 4) * Math.PI) / 180 *
        (Math.random() > 0.5 ? 1 : -1);
      const tween = gsap.to(blade, {
        rotation: blade.rotation + sway,
        duration: 2 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: Math.random() * 1.5,
      });
      windTweensRef.current.push(tween);
      }
    }
    grassLayerRef.current.sortChildren();
  };

  const applyGrowthPoints = (points: number) => {
    const tiles = orderedTilesRef.current;
    if (tiles.length === 0) return;
    const filledTiles = Math.min(tiles.length, Math.floor(points / 10));
    const previousFilled = filledTilesRef.current;
    for (let i = 0; i < tiles.length; i += 1) {
      const tile = tiles[i];
      if (i < filledTiles) {
        const isNewFill = i >= previousFilled;
        if (!tile.isWatered || tile.blades.length === 0 || isNewFill) {
          tile.isWatered = true;
          tile.target = 1;
          tile.growth = isNewFill ? 0.2 : 1;
          addGrassBladesToTile(tile, 20 + Math.floor(Math.random() * 8));
        }
      }
    }
    filledTilesRef.current = filledTiles;
  };

  const boostTile = (row: number, col: number, extra: number) => {
    const tile = tilesByKeyRef.current.get(`${row},${col}`);
    if (!tile) return;
    tile.target = Math.min(1, tile.target + 0.4);
    if (tile.growth < 0.2) tile.growth = 0.2;
    addGrassBladesToTile(tile, extra);
  };

  const boostArea = (row: number, col: number, extraCenter: number) => {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const isCenter = dr === 0 && dc === 0;
        const extra = isCenter ? extraCenter : Math.max(1, extraCenter - 3);
        boostTile(row + dr, col + dc, extra);
      }
    }
  };

  const setFacing = () => {
    if (!characterSpriteRef.current) return;
    const tilt = 0;
    gsap.to(characterSpriteRef.current, {
      rotation: tilt,
      duration: 0.2,
      ease: "sine.out",
    });
  };

  const beginWatering = (row: number, col: number) => {
    animationState.current = "watering";
    animationTimer.current = 60 * 4;
    if (wateringAudioRef.current) {
      wateringAudioRef.current.currentTime = 0;
      void wateringAudioRef.current.play();
    }
    boostArea(row, col, 16 + Math.floor(Math.random() * 6));
    const tile = tilesByKeyRef.current.get(`${row},${col}`);
    if (tile) {
      tile.isWatered = true;
      tile.target = 1;
      tile.growth = Math.max(tile.growth, 0.25);
    }
    const { container: can, spoutTip } = createWateringCan(1.3);
    const sprite = characterSpriteRef.current;
    if (sprite) {
      can.x = sprite.width * 0.12;
      can.y = -sprite.height * 0.45;
    } else {
      can.x = 14;
      can.y = -14;
    }
    characterRef.current?.addChild(can);
    wateringCanRef.current = can;
    wateringTipRef.current = spoutTip;
    if (characterSpriteRef.current) {
      waveTweenRef.current?.kill();
      waveTweenRef.current = gsap.to(characterSpriteRef.current, {
        rotation: characterSpriteRef.current.rotation + 0.18,
        duration: 0.18,
        yoyo: true,
        repeat: 5,
        ease: "sine.inOut",
      });
    }
  };

  const moveToTile = (row: number, col: number) => {
    if (!characterRef.current) return;
    const { x, y } = gridToScreen(row, col, tileWidth, tileHeight);
    const targetY = y + tileHeight * 0.5;
    targetPos.current = { x, y: targetY };
    targetTileRef.current = { row, col };
    animationState.current = "walking_to";

    setFacing();

    idleTweenRef.current?.kill();
    moveTweenRef.current?.kill();
    moveTweenRef.current = gsap.to(characterRef.current, {
      x,
      y: targetY,
      duration: 0.7,
      ease: "sine.inOut",
      onComplete: () => beginWatering(row, col),
    });
  };

  const returnToCenter = () => {
    if (!characterRef.current || !centerPos.current) return;
    animationState.current = "returning";
    setFacing();
    moveTweenRef.current?.kill();
    moveTweenRef.current = gsap.to(characterRef.current, {
      x: centerPos.current.x,
      y: centerPos.current.y,
      duration: 0.8,
      ease: "sine.inOut",
      onComplete: () => {
        animationState.current = "idle";
        if (characterSpriteRef.current) {
          gsap.set(characterSpriteRef.current, { rotation: 0 });
        }
        if (characterSpriteRef.current) {
          idleTweenRef.current?.kill();
          idleTweenRef.current = gsap.to(characterSpriteRef.current, {
            y: -2,
            duration: 1.6,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        }
        if (grassGrowAudioRef.current) {
          setTimeout(() => {
            if (grassGrowAudioRef.current) {
              grassGrowAudioRef.current.currentTime = 0;
              void grassGrowAudioRef.current.play();
            }
          }, 1000);
        }
      },
    });
  };

  // --- SETUP GRID ---
  useEffect(() => {
    if (!app) return;
    let disposed = false;
    let container: PIXI.Container | null = null;

    const setup = async () => {
      container = new PIXI.Container();
      container.x = offsetX;
      container.y = offsetY;
      container.sortableChildren = true;

      const gardenBase = createGardenBase(rows, cols, tileWidth, tileHeight);
      gardenBase.zIndex = -5;
      container.addChild(gardenBase);

      const grassLayer = new PIXI.Container();
      grassLayer.sortableChildren = true;
      grassLayer.zIndex = 1;
      container.addChild(grassLayer);
      grassLayerRef.current = grassLayer;
      app.stage.addChild(container);

      wateringAudioRef.current = new Audio("/sound-effects/watering.mp3");
      grassGrowAudioRef.current = new Audio("/sound-effects/grass-grown.mp3");

      try {
        const grassTexture = await PIXI.Assets.load("/grass-blade.svg");
        if (!disposed) {
          grassBladeTextureRef.current = grassTexture as PIXI.Texture;
        }
      } catch (error) {
        console.warn("Grass SVG failed to load, using fallback:", error);
      }

      if (disposed) return;
      const { container: character, sprite } = createCharacter();
      const cRow = 4.5;
      const cCol = 4.5;
      const cPos = gridToScreen(cRow, cCol, tileWidth, tileHeight);
      character.x = cPos.x;
      character.y = cPos.y + tileHeight * 0.5;
      character.zIndex = 2000;
      characterRef.current = character;
      characterSpriteRef.current = sprite;
      centerPos.current = { x: character.x, y: character.y };
      container.addChild(character);

      idleTweenRef.current = gsap.to(sprite, {
        y: -2,
        duration: 1.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      const pContainer = new PIXI.Container();
      pContainer.zIndex = 1000;
      character.addChild(pContainer);
      particlesRef.current = pContainer;

      const BORDER_SIZE = 8;
      const minRow = -BORDER_SIZE;
      const maxRow = rows + BORDER_SIZE;
      const minCol = -BORDER_SIZE;
      const maxCol = cols + BORDER_SIZE;

      const edgeLen = Math.hypot(tileWidth / 2, tileHeight / 2);
      const edgeAngle = Math.atan2(tileHeight / 2, tileWidth / 2); // ~26.565 deg

      for (let row = minRow; row < maxRow; row++) {
        for (let col = minCol; col < maxCol; col++) {
          const { x, y } = gridToScreen(row, col, tileWidth, tileHeight);
          // Depth Sorting: simple row+col is good, but screen Y is better for isometric.
          // We'll use strict row+col for tile layers.
          const zIndex = row + col;
          const isPlayable = row >= 0 && row < rows && col >= 0 && col < cols;

          if (isPlayable) {
            const bladeCount = 0;
            const blades: GrassBladeSprite[] = [];
            const toneOffset = Math.floor(Math.random() * 12) - 6;
            const growth = 0;

            for (let i = 0; i < bladeCount; i += 1) {
              const { dx, dy } = randomPointInDiamond(tileWidth, tileHeight);
              const blade = createGrassBlade(
                x + dx,
                y + dy,
                toneOffset,
                grassBladeTextureRef.current
              );
              blade.zIndex = blade.y;
              grassLayer.addChild(blade);

              blades.push({
                sprite: blade,
                baseScaleX: 1,
                baseScaleY: 1,
              });
            }

            const tileData = {
              toneOffset,
              row,
              col,
              baseX: x,
              baseY: y,
              blades,
              growth,
              target: growth,
              isWatered: false,
            };
            tilesRef.current.push(tileData);
            tilesByKeyRef.current.set(`${row},${col}`, tileData);

            // --- BOUNDARY FENCES ---
            // Correct anchoring: Midpoint of edge.
            // Top-Left Edge: (row, col) to (row, col-1)? No.
            // Let's use the explicit coordinate logic.
            // (x,y) is top-center of diamond.
            // Bottom-Right Edge: Center (w/4, h/4).
            // Bottom-Left Edge: Center (-w/4, h/4).

          // We only place fences at the EXTREME boundaries of the playable grid.
          // Top Boundary (row=0): needs Top-Left edge fence? Or Top-Right?
          // "Row 0" tiles. We need fences on the "Top-Left" side of Row 0.
          // And "Top-Right" side for Col 0?

          // Actually, simpler:
          // If row === 0, we need a fence along the (row, col) <-> (row-1, col) edge?
          // No. The "top-left" side of the diamond.
          // Vector: (-w/2, h/2). Midpoint (-w/4, h/4).

          if (row === 0) {
            // Top (Up-Right) Boundary
            const fence = createWoodenFence(edgeLen, 1.0);
            fence.x = x + tileWidth / 4;
            fence.y = y + tileHeight / 4;
            fence.rotation = edgeAngle; // Down-Right
            fence.zIndex = zIndex + 2;
            container.addChild(fence);

            // Corner Post
            const post = createCornerPost(1.0);
            post.x = x;
            post.y = y;
            post.zIndex = zIndex + 3;
            container.addChild(post);
          }
          if (col === 0) {
            // Left boundary (Up-Left).
            // Edge is from (0,0) to (-w/2, h/2)? No.
            // (r, c-1) is x=(c-1-r)w/2 = x - w/2. y = y - h/2.
            // Edge to (r, c-1).
            const fence = createWoodenFence(edgeLen, 1.0);
            fence.x = x - tileWidth / 4;
            fence.y = y + tileHeight / 4;
            fence.rotation = -edgeAngle; // Down-Left
            fence.zIndex = zIndex + 2;
            container.addChild(fence);
          }
          if (row === rows - 1) {
            // Bottom-Left Boundary
            const fence = createWoodenFence(edgeLen, 1.0);
            fence.x = x - tileWidth / 4;
            fence.y = y + tileHeight + tileHeight / 4; // Wait, bottom corner is y+tileHeight
            // Let's use the bottom center: (0, tileHeight).
            // Edge from (0, tileHeight) to (-w/2, h/2).
            // Midpoint: (-w/4, 3h/4).
            fence.x = x - tileWidth / 4;
            fence.y = y + tileHeight * 0.75;
            fence.rotation = edgeAngle; // Parallel to Top-Right? No, parallel to Up-Right but shifted?
            fence.rotation = edgeAngle;
            fence.zIndex = zIndex + 4;
            container.addChild(fence);

            const post = createCornerPost();
            post.x = x;
            post.y = y + tileHeight;
            post.zIndex = zIndex + 5;
            container.addChild(post);
          }
          if (col === cols - 1) {
            // Bottom-Right Boundary
            const fence = createWoodenFence(edgeLen, 1.0);
            fence.x = x + tileWidth / 4;
            fence.y = y + tileHeight * 0.75;
            fence.rotation = -edgeAngle;
            fence.zIndex = zIndex + 4;
            container.addChild(fence);

            const post = createCornerPost();
            post.x = x;
            post.y = y + tileHeight;
            post.zIndex = zIndex + 5;
            container.addChild(post);

            if (row === 0) {
              const p2 = createCornerPost();
              p2.x = x + tileWidth / 2;
              p2.y = y + tileHeight / 2;
              p2.zIndex = zIndex + 5;
              container.addChild(p2);
            }
          }
          } else {
            // Forest (Z-Index fix)
            const ground = new PIXI.Graphics();
            ground.beginFill(0x1b5e20);
            ground.moveTo(0, 0);
            ground.lineTo(tileWidth / 2, tileHeight / 2);
            ground.lineTo(0, tileHeight);
            ground.lineTo(-tileWidth / 2, tileHeight / 2);
            ground.endFill();
            ground.x = x;
            ground.y = y;
            ground.zIndex = zIndex - 1; // Behind grass
            container.addChild(ground);

            const tree = createHighQualityTree(
              Math.random() > 0.5 ? "large" : "medium"
            );
            tree.x = x;
            tree.y = y + tileHeight * 0.75;
            tree.zIndex = zIndex + 6; // Keep forest trees in front of boundary fences
            container.addChild(tree);

            const sway =
              ((Math.random() * 5 + 3) * Math.PI) / 180 *
              (Math.random() > 0.5 ? 1 : -1);
            const tween = gsap.to(tree, {
              rotation: tree.rotation + sway,
              duration: 2 + Math.random() * 2,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
              delay: Math.random() * 2,
            });
            treeTweensRef.current.push(tween);
          }
        }
      }

      orderedTilesRef.current = [...tilesRef.current].sort((a, b) => {
        if (a.baseY !== b.baseY) return a.baseY - b.baseY;
        return a.baseX - b.baseX;
      });
      applyGrowthPoints(growthPoints);

      for (const tile of tilesRef.current) {
        for (const blade of tile.blades) {
          const sway =
            ((Math.random() * 6 + 4) * Math.PI) / 180 *
            (Math.random() > 0.5 ? 1 : -1);
          const tween = gsap.to(blade.sprite, {
            rotation: blade.sprite.rotation + sway,
            duration: 2 + Math.random() * 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            delay: Math.random() * 1.5,
          });
          windTweensRef.current.push(tween);
        }
      }

      container.sortChildren();
    };

    void setup();

    return () => {
      disposed = true;
      if (container && container.parent) {
        app.stage.removeChild(container);
      }
      container?.destroy({ children: true });
      if (wateringAudioRef.current) {
        wateringAudioRef.current.pause();
        wateringAudioRef.current.currentTime = 0;
      }
      if (grassGrowAudioRef.current) {
        grassGrowAudioRef.current.pause();
        grassGrowAudioRef.current.currentTime = 0;
      }
      tilesRef.current = [];
      tilesByKeyRef.current.clear();
      orderedTilesRef.current = [];
      grassLayerRef.current = null;
      for (const tween of windTweensRef.current) {
        tween.kill();
      }
      windTweensRef.current = [];
      for (const tween of treeTweensRef.current) {
        tween.kill();
      }
      treeTweensRef.current = [];
      moveTweenRef.current?.kill();
      waveTweenRef.current?.kill();
      idleTweenRef.current?.kill();
    };
  }, [app, offsetX, offsetY, rows, cols, tileWidth, tileHeight, growthPoints]);

  // --- GAME LOOP ---
  useTick((delta) => {
    frameRef.current += 1;
    const frame = frameRef.current;

    // Dynamic Z-Index for Character
    if (characterRef.current) {
      characterRef.current.zIndex =
        2000 + characterRef.current.y;
    }

    if (
      animationState.current === "watering" &&
      wateringCanRef.current
    ) {
      // TIMER LOGIC
      animationTimer.current -= 1;

      const can = wateringCanRef.current;
      if (can.rotation < 0.8) can.rotation += 0.05;

      // Particles
      if (
        frame % 2 === 0 &&
        particlesRef.current &&
        wateringCanRef.current &&
        wateringTipRef.current
      ) {
        const p = new PIXI.Graphics();
        const size = 1.5 + Math.random() * 2.5;
        p.beginFill(0x5fc7ff, 0.85);
        p.drawCircle(0, 0, size);
        p.endFill();
        const can = wateringCanRef.current;
        const tip = wateringTipRef.current;
        const angle = can.rotation;
        const tipX = tip.x * Math.cos(angle) - tip.y * Math.sin(angle);
        const tipY = tip.x * Math.sin(angle) + tip.y * Math.cos(angle);
        p.x = can.x + tipX + Math.random() * 3;
        p.y = can.y + tipY + Math.random() * 3;
        (p as any).vy = 1 + Math.random() * 1.5;
        (p as any).vx = -0.3 + Math.random() * 0.6;
        (p as any).fade = 0.03 + Math.random() * 0.02;
        particlesRef.current.addChild(p);
      }
      if (particlesRef.current) {
        for (const p of particlesRef.current.children) {
          p.x += (p as any).vx;
          p.y += (p as any).vy;
          (p as any).alpha -= (p as any).fade;
          if (p.alpha <= 0) p.destroy();
        }
      }

      // STATE TRANSITION
      if (animationTimer.current <= 0) {
        returnToCenter();
        can.destroy(); // CLEANUP CAN
        wateringCanRef.current = null;
        if (wateringAudioRef.current) {
          wateringAudioRef.current.pause();
          wateringAudioRef.current.currentTime = 0;
        }
        // CLEANUP REMAINING PARTICLES IMMEDIATELY OR LET THEM FADE?
        // User said "object must be explicitly removed".
        if (particlesRef.current) particlesRef.current.removeChildren();
      }
    }

    if (tilesRef.current.length > 0) {
      for (const tile of tilesRef.current) {
        if (tile.growth < tile.target) {
          tile.growth = Math.min(
            tile.target,
            tile.growth + 0.03 * Number(delta)
          );
        }
        const growthScale = 0.25 + tile.growth * 0.75;
        for (const blade of tile.blades) {
          const sprite = blade.sprite as PIXI.Sprite;
          sprite.scale.set(
            blade.baseScaleX * growthScale,
            blade.baseScaleY * growthScale
          );
        }
      }
    }
  });

  // --- TRIGGER LOGIC ---
  useEffect(() => {
    if (isWatering && animationState.current === "idle") {
      if (visitWateredRef.current) return;
      const tiles = orderedTilesRef.current;
      if (tiles.length === 0) return;
      const filledTiles = Math.min(tiles.length, Math.floor(growthPoints / 10));
      const pick = tiles[filledTiles];
      if (!pick || pick.isWatered) return;
      visitWateredRef.current = true;
      moveToTile(pick.row, pick.col);
    }
    if (!isWatering) {
      visitWateredRef.current = false;
    }
  }, [isWatering, growthPoints]);

  useEffect(() => {
    applyGrowthPoints(growthPoints);
  }, [growthPoints]);

  return null;
};
