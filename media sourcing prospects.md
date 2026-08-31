## insights to be considered.


Building automated, programmatically driven video pipelines with AI agents requires repositories that offer structured APIs, direct CDN/raw file links, explicit machine-readable metadata, and reliable public domain (CC0) or permissive licenses (CC BY / MIT). Generic consumer platforms (like Pexels or Unsplash) often block headless scraping or enforce restrictive API rate limits.

  

Below is an extensive collection of high-utility, open-access visual, audio, and motion repositories ideal for agentic video generation.

  

### **Video & Moving Image Repositories**

- **Prelinger Archives (via Internet Archive)**
    
      
    - **Focus:** Over 17,000 archival film clips, mid-century propaganda, educational films, industrial b-roll, and cultural history.
        
          
        
    - **Licensing:** Public Domain.
        
          
        
    - **Agentic Utility:** Full REST access via the Internet Archive API. Provides predictable direct direct HTTP file links (`.mp4`, `.ogv`) without JavaScript rendering obstacles.
        
          
        
- **Wikimedia Commons (Video Directory)**
    
      
    - **Focus:** Global historical events, scientific visualizations, wildlife footage, geography, and cultural artifacts.
        
          
        
    - **Licensing:** Public Domain (CC0), CC BY, CC BY-SA.
        
          
        
    - **Agentic Utility:** Queryable via the MediaWiki Action API. Returns structured JSON containing direct `url` targets, frame dimensions, precise attribution text, and license metadata.
        
          
        
- **National Archives and Records Administration (NARA / Motion Picture Catalog)**
    
      
    - **Focus:** U.S. government production, military footage, space program footage, historical newsreels, and global diplomatic events.
        
          
        
    - **Licensing:** Public Domain (U.S. Federal Government works).
        
          
        
    - **Agentic Utility:** Accessible programmatically via the NARA API (`api.archives.gov`), returning raw media assets hosted on AWS S3 buckets.
        
          
        
- **Open Images Video (Google Research)**
    
      
    - **Focus:** Millions of short annotated video clips specifically designed for machine learning, computer vision, and frame segmentation.
        
          
        
    - **Licensing:** Creative Commons Attribution 4.0 (CC BY 4.0).
        
          
        
    - **Agentic Utility:** Native CSV index files and Google Cloud Storage buckets allow agents to instantly pull timestamped, object-annotated video chunks.
        
          
        

### **3D Models, Environments & VFX Assets**

- **Poly Pizza**
    
      
    - **Focus:** Tens of thousands of low-poly 3D models (props, characters, environments, vehicles).
        
          
        
    - **Licensing:** CC0 (Public Domain) and CC BY.
        
          
        
    - **Agentic Utility:** Features a clean API returning direct `.gltf` and `.obj` file download URLs for rapid rendering in dynamic 3D engines like Three.js, Blender headless, or Godot.
        
          
        
- **AmbientCG**
    
      
    - **Focus:** High-resolution PBR (Physically Based Rendering) materials, textures, HDRI skyboxes, and 3D scans.
        
          
        
    - **Licensing:** Creative Commons CC0 (Public Domain).
        
          
        
    - **Agentic Utility:** Offers a fully documented REST API (`[ambientcg.com/api/v2](https://ambientcg.com/api/v2)`). Agents can query by tag, resolution, or format and programmatically download map zips (roughness, normal, diffuse).
        
          
        
- **NASA 3D Resources Catalog**
    
      
    - **Focus:** Scientifically accurate 3D models of spacecraft, satellites, planets, asteroids, and landing sites.
        
          
        
    - **Licensing:** Public Domain (generally free for educational and creative use without trademarked logos).
        
          
        
    - **Agentic Utility:** GitHub-hosted directory structure allowing headless git cloning or HTTP extraction of raw `.stl` and `.obj` files.
        
          
        

### **Audio, Music & Sound Effects**

- **Freesound.org (Music Technology Group, UPF Barcelona)**
    
      
    - **Focus:** Global environmental ambient soundscapes, field recordings, Foley effects, and instrumental samples.
        
          
        
    - **Licensing:** CC0, CC BY, CC BY-NC.
        
          
        
    - **Agentic Utility:** Features one of the most robust audio APIs (`freesound.org/docs/api/`). Allows agents to query sound files by acoustic metrics (e.g., spectral centroid, pitch, duration) alongside license filtering.
        
          
        
- **Free Music Archive (FMA) / FMA API**
    
      
    - **Focus:** Curator-driven global music tracks spanning niche genres, electronic soundscapes, traditional world music, and ambient scores.
        
          
        
    - **Licensing:** Creative Commons (CC0, CC BY, CC BY-SA).
        
          
        
    - **Agentic Utility:** Offers an official API to search tracks by genre, tempo, mood, and strict CC-license boundaries.
        
          
        
- **UI SFX (GitHub / Open Source)**
    
      
    - **Focus:** Semantic sound effect packs built for system states, transitions, UI triggers, and interface sounds.
        
          
        
    - **Licensing:** MIT / Open Source.
        
          
        
    - **Agentic Utility:** Raw `.mp3` and `.ogg` files hosted directly in GitHub repositories, enabling git-cloning or direct `raw.githubusercontent.com` HTTP fetches without authentication.
        
          
        

### **Graphics, Cartography & Visual Data**

- **OpenStreetMap (OSM) / Overpass API**
    
      
    - **Focus:** Global vector map data, building footprints, topographic layouts, and road network geometries.
        
          
        
    - **Licensing:** Open Database License (ODbL).
        
          
        
    - **Agentic Utility:** Agents can pass GeoJSON bounds to the Overpass API to dynamically generate vector maps, 3D cityscapes (via OSM-to-OBJ tools), or animated map transitions.
        
          
        
- **The Met Collection API (Metropolitan Museum of Art)**
    
      
    - **Focus:** Over 400,000 high-resolution public domain images of art, antiquities, and global cultural artifacts.
        
          
        
    - **Licensing:** CC0 (Public Domain).
        
          
        
    - **Agentic Utility:** Highly reliable REST endpoints (`api.metmuseum.org`) returning direct, high-definition `primaryImage` URLs with complete historical metadata for automated slideshow or montage generation.
        
          
        
- **Openclipart**
    
      
    - **Focus:** Entirely vector-based (`.svg`) graphics, icons, silhouettes, and illustrations.
        
          
        
    - **Licensing:** CC0 / Public Domain.
        
          
        
    - **Agentic Utility:** Simple JSON API returning direct `.svg` links. SVG vectors are ideal for agents because they can be modified on-the-fly via code (recolorings, scale adjustments) prior to video compilation.
        

### **Implementation Strategy for AI Agents**

|**Asset Category**|**Target Platform**|**Primary Integration API / URL**|**Key Retrieval Metric**|
|---|---|---|---|
|**Archival Video**|Internet Archive|`archive.org/advancedsearch.php`|`mediatype:movies AND licenseurl:*publicdomain*`|
|**3D Assets**|AmbientCG|`[ambientcg.com/api/v2/full_res](https://ambientcg.com/api/v2/full_res)`|Filter by `datatype=Material` & `attribute=CC0`|
|**Sound / SFX**|Freesound|`freesound.org/apiv2/search/text/`|Filter by `license:"Creative Commons 0"`|
|**Cultural Art**|The Met API|`collectionapi.metmuseum.org/v1/objects`|Filter by `isPublicDomain=true`|



Choosing the right open-source rendering framework depends on your tech stack (TypeScript/Node.js vs. Python) and whether your AI agents generate visuals via web standards (HTML/CSS/Canvas) or raw programmatic clips (FFmpeg pipelines).

  

### **TypeScript / JavaScript (Web-Tech Centric)**

These engines excel when your AI agents construct UI, text, vector overlays, or HTML/Canvas-based motion graphics.

  

- **Remotion**
    
      
    - **How it Works:** Allows you to frame video compositions using React code (HTML, CSS, WebGL, Tailwind). It leverages headless Chrome via Puppeteer to render exact frames down to the millisecond.
        
          
        
    - **Agentic Fit:** Agents can dynamically generate JSON or React props, pass them to a headless render queue, and output MP4 files.
        
          
        
    - _Note:_ Remotion core is open-source, but requires a paid license for commercial entities with 3+ employees.
        
          
        
- **FFCreator**
    
      
    - **How it Works:** A lightweight Node.js video processing framework built on WebGL (via `headless-gl`) and FFmpeg. It simulates web-style CSS animations and scene transitions without needing a full browser instance like Chrome.
        
          
        
    - **Agentic Fit:** Extremely fast frame execution and low memory overhead. Agents can emit simple JSON scene trees defining dynamic text, overlays, and audio timing.
        
          
        
- **Motion Canvas**
    
      
    - **How it Works:** TypeScript-first vector animation system using HTML Canvas. Uses procedural JavaScript generators to schedule animations frame-by-frame.
        
          
        
    - **Agentic Fit:** Excellent for AI agents generating data visualizations, mathematical graphs, or technical diagram animations programmatically.
        
          
        

### **Python (Data Science & AI Native)**

Ideal if your agents run natively in Python (e.g., using LangChain, AutoGen, or custom agentic loops) and need to operate directly on raw media streams, arrays, or PIL images.

  

- **MoviePy**
    
      
    - **How it Works:** High-level Python library wrapping FFmpeg, ImageMagick, and NumPy for cutting, concatenating, titling, and basic compositing.
        
          
        
    - **Agentic Fit:** Simple syntax for procedural clip assembly. An AI agent can parse audio timestamps (e.g., Whisper JSON transcriptions) and instantly splice dynamic video tracks to match speech beats.
        
          
        
- **Manim (Community Edition)**
    
      
    - **How it Works:** Programmatic engine originally created by 3Blue1Brown for precise, code-driven mathematical animations.
        
          
        
    - **Agentic Fit:** An agent can be instructed to generate python script blocks using `manim` primitives to render dynamic charts, code syntax breakdowns, or procedural vector animations on the fly.
        
          
        
- **fmov**
    
      
    - **How it Works:** A fast, lightweight Python tool that bridges Python PIL/NumPy image generation directly into FFmpeg pipelines without writing intermediate disk files.
        
          
        
    - **Agentic Fit:** Higher throughput than standard MoviePy when agents are generating generative-art or canvas frames in memory using Python image libraries.
        
          
        

### **Low-Level Native & Command Line**

- **FFmpeg (C / CLI)**
    
      
    - **How it Works:** The universal industrial-standard engine underlying almost all programmatic video processing.
        
          
        
    - **Agentic Fit:** AI agents capable of executing bash or system calls can generate complex FFmpeg `filter_complex` graphs directly. This eliminates overhead from higher-level runtime languages, achieving maximum speed for simple video stitching, audio-video syncing, and text-watermarking.
        
          
        
- **MLT Framework**
    
      
    - **How it Works:** An open-source, multimedia framework built for non-linear video editing. Power house behind desktop editors like Shotcut.
        
          
        
    - **Agentic Fit:** Offers C/Python/Node bindings and accepts plain XML playlist files (`melt`). AI agents can write lightweight XML scripts defining complex multi-track timelines, cuts, and transitions, then render them silently in headless mode.
        

### **Framework Selection Matrix**

|**Tool**|**Primary Language**|**Rendering Engine**|**Best For**|
|---|---|---|---|
|**Remotion**|TypeScript / React|Headless Chrome (Puppeteer)|Complex UI overlays, web design, React component video templates|
|**FFCreator**|Node.js|`node-canvas` / `headless-gl` + FFmpeg|Rapid short-form video generation, automated slideshows, low-resource VPS|
|**MoviePy**|Python|Python + FFmpeg|Rapid python agent integration, AI voiceover alignment, basic splicing|
|**Manim**|Python|Cairo / OpenGL / Python|Explainer videos, mathematical visualizations, vector motion graphics|
|**MLT (Melt)**|C / Python XML|MLT Engine|Multi-track timeline assembly, NLE-style headless automated editing|
Here is a production-ready Python script for MoviePy v2.0+. It demonstrates how an AI agent can read a structured JSON payload—containing video clip cuts, text captions, and audio overlays—and compile it into a final output video.

  

### JSON Payload (`manifest.json`)

This structure allows an AI agent to specify source media, time cuts, and overlay positions programmatically.

JSON

```
{
  "output": "agent_render.mp4",
  "fps": 30,
  "size": [1920, 1080],
  "clips": [
    {
      "source_path": "assets/broll_nature.mp4",
      "start": 12.5,
      "end": 17.5
    },
    {
      "source_path": "assets/broll_city.mp4",
      "start": 2.0,
      "end": 6.0
    }
  ],
  "overlays": [
    {
      "type": "text",
      "content": "AI Agent Video Pipeline",
      "start": 0.5,
      "duration": 4.0,
      "font_size": 60,
      "color": "white",
      "position": ["center", "center"]
    }
  ],
  "audio": {
    "voiceover_path": "assets/narration.mp3"
  }
}
```

### Python Renderer Script (`assemble_video.py`)

Python

```
import json
import os
from typing import Dict, Any, List
from moviepy import (
    VideoFileClip,
    AudioFileClip,
    TextClip,
    CompositeVideoClip,
    concatenate_videoclips
)

def build_video_from_json(manifest: Dict[str, Any]) -> str:
    """
    Parses a JSON manifest and compiles video cuts, text overlays, 
    and audio using MoviePy v2.0+.
    """
    output_filename = manifest.get("output", "output.mp4")
    target_fps = manifest.get("fps", 30)
    canvas_size = tuple(manifest.get("size", [1920, 1080]))
    
    video_segments: List[VideoFileClip] = []

    # 1. Slice and gather sequential video clips
    for item in manifest.get("clips", []):
        src = item["source_path"]
        start_t = float(item["start"])
        end_t = float(item["end"])

        if not os.path.exists(src):
            raise FileNotFoundError(f"Asset missing: {src}")

        # Extract subclip based on JSON timestamps
        clip = VideoFileClip(src).subclipped(start_t, end_t)
        
        # Standardize canvas resolution for all clips
        clip = clip.resized(new_size=canvas_size)
        video_segments.append(clip)

    if not video_segments:
        raise ValueError("No valid video clips found in payload.")

    # Concatenate B-roll segments back-to-back
    base_video = concatenate_videoclips(video_segments, method="compose")

    # 2. Process Overlays (Text / Titles)
    overlay_clips = []
    for overlay in manifest.get("overlays", []):
        if overlay.get("type") == "text":
            txt_clip = TextClip(
                text=overlay["content"],
                font_size=overlay.get("font_size", 50),
                color=overlay.get("color", "white"),
                size=canvas_size
            )
            
            # Position & Timing setup (MoviePy 2.0 with_* methods)
            txt_clip = (
                txt_clip
                .with_start(float(overlay.get("start", 0)))
                .with_duration(float(overlay.get("duration", 3.0)))
                .with_position(tuple(overlay.get("position", ["center", "center"])))
            )
            overlay_clips.append(txt_clip)

    # Layer overlays over the base video
    final_visual = CompositeVideoClip([base_video] + overlay_clips)

    # 3. Attach Audio Tracks
    audio_config = manifest.get("audio", {})
    if audio_config.get("voiceover_path"):
        vo_path = audio_config["voiceover_path"]
        if os.path.exists(vo_path):
            audio_clip = AudioFileClip(vo_path)
            # Match audio length or trim video automatically
            audio_clip = audio_clip.subclipped(0, min(audio_clip.duration, final_visual.duration))
            final_visual = final_visual.with_audio(audio_clip)

    # 4. Render output file
    final_visual.write_videofile(
        output_filename,
        fps=target_fps,
        codec="libx264",
        audio_codec="aac",
        threads=4
    )

    # Cleanup open file handles
    base_video.close()
    final_visual.close()

    return output_filename


if __name__ == "__main__":
    # Load and execute rendering manifest
    with open("manifest.json", "r") as f:
        payload = json.load(f)

    result_path = build_video_from_json(payload)
    print(f"Render complete: {result_path}")
```




Below is the updated script, extended to support crossfade transitions between clips and animated lower-third graphics (a banner sliding up with animated text fade-in) built purely using MoviePy v2.0+ primitives.

### Updated JSON Payload (`manifest.json`)

JSON

```
{
  "output": "agent_render_transitions.mp4",
  "fps": 30,
  "size": [1920, 1080],
  "transition_duration": 1.0,
  "clips": [
    {
      "source_path": "assets/broll_nature.mp4",
      "start": 12.5,
      "end": 17.5
    },
    {
      "source_path": "assets/broll_city.mp4",
      "start": 2.0,
      "end": 6.0
    }
  ],
  "lower_thirds": [
    {
      "title": "Jane Doe",
      "subtitle": "Lead AI Engineer",
      "start": 1.5,
      "duration": 4.0,
      "color": "white",
      "bg_color": [20, 20, 30]
    }
  ],
  "audio": {
    "voiceover_path": "assets/narration.mp3"
  }
}
```

### Python Renderer Script (`assemble_video.py`)

Python

```
import json
import os
from typing import Dict, Any, List
from moviepy import (
    VideoFileClip,
    AudioFileClip,
    TextClip,
    ColorClip,
    CompositeVideoClip,
    concatenate_videoclips
)
from moviepy.video.fx import CrossFadeIn, FadeIn, FadeOut


def create_animated_lower_third(
    title: str,
    subtitle: str,
    start_time: float,
    duration: float,
    canvas_size: tuple = (1920, 1080),
    title_color: str = "white",
    bg_rgb: tuple = (20, 20, 30)
) -> CompositeVideoClip:
    """
    Constructs an animated lower-third overlay with a sliding background 
    banner and fading typography.
    """
    canvas_w, canvas_h = canvas_size
    banner_w, banner_h = int(canvas_w * 0.35), int(canvas_h * 0.12)
    padding_left = int(canvas_w * 0.05)
    padding_bottom = int(canvas_h * 0.08)

    # Base positioning coordinates
    target_x = padding_left
    target_y = canvas_h - padding_bottom - banner_h
    hidden_y = canvas_h  # Off-screen start position

    # 1. Background Box
    bg_box = ColorClip(size=(banner_w, banner_h), color=bg_rgb)
    bg_box = (
        bg_box
        .with_start(start_time)
        .with_duration(duration)
    )

    # Slide-up animation (0.5s entrance)
    slide_time = 0.5
    def pos_anim(t):
        if t < slide_time:
            # Linear interpolate from hidden_y to target_y
            progress = t / slide_time
            curr_y = hidden_y - (hidden_y - target_y) * progress
            return (target_x, curr_y)
        return (target_x, target_y)

    bg_box = bg_box.with_position(pos_anim)

    # 2. Text Elements
    title_clip = TextClip(
        text=title,
        font_size=36,
        color=title_color,
        size=(banner_w - 40, None)
    )
    subtitle_clip = TextClip(
        text=subtitle,
        font_size=24,
        color="lightgray",
        size=(banner_w - 40, None)
    )

    # Position text inside the sliding banner
    title_clip = (
        title_clip
        .with_start(start_time + 0.2)
        .with_duration(duration - 0.2)
        .with_position(lambda t: (target_x + 20, pos_anim(t)[1] + 15))
        .with_effects([FadeIn(0.3), FadeOut(0.3)])
    )

    subtitle_clip = (
        subtitle_clip
        .with_start(start_time + 0.35)
        .with_duration(duration - 0.35)
        .with_position(lambda t: (target_x + 20, pos_anim(t)[1] + 60))
        .with_effects([FadeIn(0.3), FadeOut(0.3)])
    )

    return [bg_box, title_clip, subtitle_clip]


def build_video_from_json(manifest: Dict[str, Any]) -> str:
    output_filename = manifest.get("output", "output.mp4")
    target_fps = manifest.get("fps", 30)
    canvas_size = tuple(manifest.get("size", [1920, 1080]))
    transition_dur = float(manifest.get("transition_duration", 1.0))
    
    video_segments: List[VideoFileClip] = []

    # 1. Process Video Clips with Crossfades
    raw_clips = manifest.get("clips", [])
    for i, item in enumerate(raw_clips):
        src = item["source_path"]
        start_t = float(item["start"])
        end_t = float(item["end"])

        if not os.path.exists(src):
            raise FileNotFoundError(f"Asset missing: {src}")

        clip = VideoFileClip(src).subclipped(start_t, end_t)
        clip = clip.resized(new_size=canvas_size)

        # Apply CrossFadeIn effect to subsequent clips
        if i > 0 and transition_dur > 0:
            clip = clip.with_effects([CrossFadeIn(transition_dur)])

        video_segments.append(clip)

    if not video_segments:
        raise ValueError("No valid video clips found in payload.")

    # Concatenate using negative padding for smooth crossfade overlap
    if transition_dur > 0 and len(video_segments) > 1:
        base_video = concatenate_videoclips(
            video_segments, 
            padding=-transition_dur, 
            method="compose"
        )
    else:
        base_video = concatenate_videoclips(video_segments, method="compose")

    # 2. Process Lower-Third Graphics
    overlay_clips = []
    for lt in manifest.get("lower_thirds", []):
        lt_elements = create_animated_lower_third(
            title=lt["title"],
            subtitle=lt["subtitle"],
            start_time=float(lt.get("start", 0)),
            duration=float(lt.get("duration", 3.0)),
            canvas_size=canvas_size,
            title_color=lt.get("color", "white"),
            bg_rgb=tuple(lt.get("bg_color", [20, 20, 30]))
        )
        overlay_clips.extend(lt_elements)

    final_visual = CompositeVideoClip([base_video] + overlay_clips, size=canvas_size)

    # 3. Audio Track Sync
    audio_config = manifest.get("audio", {})
    if audio_config.get("voiceover_path"):
        vo_path = audio_config["voiceover_path"]
        if os.path.exists(vo_path):
            audio_clip = AudioFileClip(vo_path)
            audio_clip = audio_clip.subclipped(0, min(audio_clip.duration, final_visual.duration))
            final_visual = final_visual.with_audio(audio_clip)

    # 4. Render output
    final_visual.write_videofile(
        output_filename,
        fps=target_fps,
        codec="libx264",
        audio_codec="aac",
        threads=4
    )

    base_video.close()
    final_visual.close()

    return output_filename


if __name__ == "__main__":
    with open("manifest.json", "r") as f:
        payload = json.load(f)

    result_path = build_video_from_json(payload)
    print(f"Render complete: {result_path}")
```



In this pattern, an AI agent takes raw data (like GitHub metrics, user stats, or automated news summaries) and passes it as dynamic props into a React component. Remotion then programmatically launches headless Chrome, renders the React tree frame-by-frame, and outputs an MP4.

  

### 1. The React Composition (`src/MetricsVideo.tsx`)

This component defines the visual template using standard React and Tailwind CSS. It uses Remotion’s `useCurrentFrame`, `interpolate`, and `spring` to calculate smooth animations based on the current frame index.

  

TypeScript

```
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface MetricsVideoProps {
  title: string;
  metricLabel: string;
  metricValue: number;
  accentColor: string;
}

export const MetricsVideo: React.FC<MetricsVideoProps> = ({
  title,
  metricLabel,
  metricValue,
  accentColor = '#3b82f6',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  # 1. Spring animation for the container entrance
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  # 2. Smoothly count up the number over the first 45 frames
  const displayedValue = Math.round(
    interpolate(frame, [15, 60], [0, metricValue], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  # 3. Fade in text overlay
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="bg-slate-950 text-white flex items-center justify-center font-sans">
      <div
        style={{
          transform: `scale(${cardScale})`,
          opacity,
          borderColor: accentColor,
        }}
        className="w-[800px] p-12 rounded-3xl bg-slate-900/80 border-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-6"
      >
        <h1 className="text-4xl font-bold tracking-tight text-slate-300">
          {title}
        </h1>

        <div className="flex flex-col items-center my-4">
          <span
            style={{ color: accentColor }}
            className="text-8xl font-black tracking-wider"
          >
            {displayedValue.toLocaleString()}
          </span>
          <span className="text-xl text-slate-400 mt-2 font-medium uppercase tracking-widest">
            {metricLabel}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

### 2. Composition Registration (`src/Root.tsx`)

Register the component inside Remotion's entry point, defining default props and resolution (1080p, 30 FPS, 5 seconds duration).

  

TypeScript

```
import { Composition } from 'remotion';
import { MetricsVideo } from './MetricsVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MetricsSummary"
      component={MetricsVideo}
      durationInFrames={150} # 5 seconds at 30 fps
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: 'Weekly Performance',
        metricLabel: 'Active Users',
        metricValue: 12450,
        accentColor: '#3b82f6',
      }}
    />
  );
};
```

### 3. Agent Execution Script (`render.ts`)

An agentic pipeline calls this Node.js script. It bundles the React application on the fly using Webpack, passes dynamic JSON input into the composition props, and renders the MP4 without opening a browser GUI.

  

TypeScript

```
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

async function runAgentRenderPipeline() {
  # 1. Simulated output payload generated by an AI Agent
  const agentOutputPayload = {
    title: 'Q3 Enterprise Deployment',
    metricLabel: 'API Requests Processed',
    metricValue: 948200,
    accentColor: '#10b981', # Emerald green accent
  };

  console.log('Building React Webpack bundle...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./src/Root.tsx'),
    # Disables webpack caching if you need fresh builds per run
    webpackOverride: (config) => config,
  });

  console.log('Selecting Composition...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MetricsSummary',
    inputProps: agentOutputPayload, # Injecting dynamic agent props
  });

  console.log('Rendering video frames...');
  const outputFile = path.resolve(`./output_agent_metrics.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputFile,
    inputProps: agentOutputPayload,
    concurrency: 4, # Utilizes multi-core rendering
  });

  console.log(`Render complete! Saved to: ${outputFile}`);
}

runAgentRenderPipeline().catch(console.error);
```

### Why this pattern works well with Agents

- **Decoupled Logic:** The video layout remains locked inside a version-controlled React component, preventing the LLM from hallucinating broken animation code or invalid CSS properties.
    
      
    
- **Pure JSON Interface:** The AI agent only needs to produce a simple JSON object matching your TypeScript interface (`title`, `metricValue`, `accentColor`).
    
      
    
- **Pixel Perfection:** Unlike HTML-to-screen recording hacks, Remotion waits for each React frame to resolve completely before writing to disk, ensuring zero dropped frames or stuttering animations during execution.
