import type { Group, Object3D, Texture } from 'three';
import type { TVProfile } from './tv-model.mjs';
export function buildTelevision(profile:TVProfile,screenTexture:Texture):Group;
export function disposeTelevision(root:Object3D):void;
