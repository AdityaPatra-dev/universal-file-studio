import React from 'react';
import {
  FileText, Film, Music, Image, Archive, Scissors, Minimize2,
  Maximize2, RotateCw, RotateCcw, Volume2, VolumeX, FastForward,
  Repeat, Clock, Captions, Camera, Shield, Stamp, GitMerge,
  Radio, TrendingUp, Sliders, Mic, Disc, Crop, BookOpen,
  EyeOff, FileCode, Grid, Smartphone, Sparkles, Square, Sun,
  Zap, Contrast, Crosshair, Compass, ShieldAlert, ScanText,
  Lock, Unlock, PenTool, Hash, ImageDown, Layers, FileCheck,
  FileSearch, ExternalLink, Sheet, Table, Shuffle, Presentation,
  Trash2, Wrench, Book, GitCompare, Globe, Tag, FolderArchive,
  FileArchive, Package, RefreshCw, CheckCircle2, Music2, FileVideo,
  LucideProps, HelpCircle
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  FileText, Film, Music, Image, Archive, Scissors, Minimize2,
  Maximize2, RotateCw, RotateCcw, Volume2, VolumeX, FastForward,
  Repeat, Clock, Captions, Camera, Shield, Stamp, GitMerge,
  Radio, TrendingUp, Sliders, Mic, Disc, Crop, BookOpen,
  EyeOff, FileCode, Grid, Smartphone, Sparkles, Square, Sun,
  Zap, Contrast, Crosshair, Compass, ShieldAlert, ScanText,
  Lock, Unlock, PenTool, Hash, ImageDown, Layers, FileCheck,
  FileSearch, ExternalLink, Sheet, Table, Shuffle, Presentation,
  Trash2, Wrench, Book, GitCompare, Globe, Tag, FolderArchive,
  FileArchive, Package, RefreshCw, CheckCircle2, Music2, FileVideo
};

interface CatalogIconProps extends LucideProps {
  name: string;
}

export const CatalogIcon: React.FC<CatalogIconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent {...props} />;
};

