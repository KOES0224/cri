# EyeSync Software Architecture & Form-Factor Integration Analysis
**Author**: Lead Systems Architect & Lead Product Designer  
**Target Category**: Conrad Challenge // Health & Nutrition (Venture Design Specification)

---

## 1. The Core UX Constraint: "The Wayfarer Standard"
To achieve widespread adoption among visually impaired and elderly users, the glasses **must look and feel indistinguishable from standard, high-end optical frames** (e.g., Ray-Ban Wayfarers). 

### 1.1 Physical Design Constraints
*   **Weight**: Must not exceed **65 grams** (human tolerance threshold for all-day wear without nose bridge soreness or slippage).
*   **Temple Width**: Maximum thickness at the ears must be under **4.5 mm** to prevent physical discomfort and maintain normal aesthetic profiles.
*   **Thermal Dissipation**: Operating temperature of the inner temple arms must remain below **38.5°C** to prevent burns or discomfort on the temporal skin. Passive cooling only (no fans, no visible cooling vents).

```
   ┌──────────────────────────────────────────────────────────┐
   │                  PHYSICAL WEIGHT BUDGET                  │
   ├───────────────────────────────┬──────────────────────────┤
   │ Component                     │ Weight (g)               │
   ├───────────────────────────────┼──────────────────────────┤
   │ TR90 Polymer Frame            │ 22.0g                    │
   │ Dual Lenses                   │  8.5g                    │
   │ Rigid-Flex PCB Assembly       │  6.2g                    │
   │ Cameras & Sensors             │  4.8g                    │
   │ Bone Conduction Transducers   │  7.5g                    │
   │ Lithium-Polymer Batteries     │ 13.0g                    │
   ├───────────────────────────────┼──────────────────────────┤
   │ Total System Weight           │ 62.0g (Target Met)       │
   └───────────────────────────────┴──────────────────────────┘
```

### 1.2 Thermal & Battery Implication on Software Design
This strict physical profile limits the battery to a maximum capacity of **640mAh** and limits heat dissipation. Therefore, running a massive, continuous on-device Vision-Language Model (VLM) at 30 frames-per-second is physically impossible—it would drain the battery in 15 minutes and overheat the temples. 

The software execution loop must be engineered around **extreme power gating** and **context-aware compute activation**.

---

## 2. Software Execution Paradigm: The Local-Split Model
To meet these constraints, the software executes on a **Hybrid Local-Split Architecture**, utilizing the user’s smartphone (carried in a pocket or bag) as a local coprocessor over a high-speed, secure Wi-Fi Direct link.

```mermaid
graph TD
    subgraph EYESYNC GLASSES (Edge Node)
        Sensors[Cameras & ToF] --> |Raw Capture| VIO[Light VIO / SLAM]
        VIO --> |Spatial Anchor| LocalNav[Local Collision Avoidance]
        Sensors --> |Trigger Event| FrameBuf[Image Frame Buffer]
        FrameBuf --> |Compressed Feed| Transmit{Transmit to Phone?}
        LocalNav --> |Real-time Audio| User[User Bone Conduction]
    end

    subgraph COMPANION PHONE (Pocket Compute)
        Transmit --> |Wi-Fi Direct| PhoneRx[Phone Receiver]
        PhoneRx --> |Run Quantized LLaVA / VLM| VLMProc[Scene Semantics & OCR]
        VLMProc --> |Text Description / Coords| PhoneTx[Phone Transmitter]
        PhoneTx --> |Bluetooth Audio Link| User
    end
```

### 2.1 The Multi-Tier Processing Loop
The system breaks task execution down into three distinct processing tiers based on latency and compute intensity:

#### Tier 1: Real-Time Reflex Loop (Sub-30ms Latency) — Executed entirely on Glasses
*   **Tasks**: IMU tracking, Time-of-Flight ranging, and Visual-Inertial Odometry (VIO) for step-by-step navigation.
*   **Execution**: Runs on the low-power **STM32H7 MCU**. It reads raw IMU and ToF registers, calculating if an obstacle has entered the immediate 1.5-meter path vector.
*   **Power State**: Always-On. Consumes less than **45mW**.

#### Tier 2: Dynamic Spatial Mapping (Sub-100ms Latency) — Executed on Glasses SoC
*   **Tasks**: Object categorization (detecting stairs, doors, pedestrian directions) and hand-coordinate tracking for kiosk interaction.
*   **Execution**: Run on the **Qualcomm Snapdragon XR2 Gen 2 NPU** using a highly pruned, INT8-quantized YOLO-v8 model.
*   **Power State**: Duty-Cycled. The cameras and NPU are asleep when the user is sitting still or walking a known, open path. They wake up instantly when the IMU detects movement or a Tier 1 obstacle trigger. Consumes **350mW - 600mW** during active scanning.

#### Tier 3: Semantic Semantic Loop (Sub-800ms Latency) — Offloaded to Smartphone
*   **Tasks**: High-level visual reasoning (e.g. *"What options are on this touchscreen?"* or *"Read this prescription bottle"*).
*   **Execution**: The glasses capture a single high-resolution frame, compress it, and stream it via Wi-Fi Direct to the companion smartphone. The phone runs a quantized 3.8B parameter Vision-Language Model (e.g., Phi-3-Vision) locally in RAM, returning the text coordinate mappings to the glasses.
*   **Power State**: On-Demand. Triggered only by verbal user queries. Consumes **1.2W** during frame transmission, returning to sleep within 1.5 seconds.

---

## 3. Alternative Architectures & Trade-Off Analysis
During research, three structural architectures were evaluated. The table below outlines why the Local-Split Model was selected:

| Architectural Option | Description | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Cloud-Only API** | Glasses compress video and stream continuously over 5G to cloud VLMs (e.g. GPT-4o). | • Minimal on-device compute required.<br>• Frame remains lightweight.<br>• Access to unlimited model sizing. | • High latency (1.5s - 3s).<br>• Fails without cellular signal.<br>• Massive cellular data costs.<br>• Privacy liabilities. | **REJECTED**<br>(Unsafe for real-time hazard detection) |
| **Option B: Pure On-Device** | All models (VIO, Segmentations, VLMs) run locally on the glasses' SoC. | • 100% offline capability.<br>• Zero external dependency.<br>• Minimal latency. | • Frame exceeds weight limit (>95g).<br>• Temples overheat (>44°C).<br>• Battery life is under 45 minutes. | **REJECTED**<br>(Exceeds Wayfarer design envelope) |
| **Option C: Local-Split** *(Selected)* | Spatial VIO runs on glasses; semantic VLMs are offloaded to phone over Wi-Fi. | • Frame stays light (62g).<br>• Cool thermal profile.<br>• Safe real-time response. | • Requires the user to carry their smartphone. | **SELECTED**<br>(Ideal balance of form and logic) |

---

## 4. Engineering Implementation Detail: The Kiosk Solver Loop
To illustrate how this software behaves in real-world environments, here is the step-by-step logic for ordering at a kiosk (e.g., McDonald's terminal):

```
1. USER voice trigger: "Help me order."
2. GLASSES wake camera -> Stream frame to PHONE.
3. PHONE runs screen detection -> Returns relative pixel offset of screen.
4. PHONE runs OCR -> Extracts text and maps coords relative to screen coordinates.
5. PHONE reads options: "Select 1: Cheeseburger, Select 2: Salad. Say selection."
6. USER states: "Select 1."
7. GLASSES wake local hand tracking -> Captures hand coordinate vector (X_hand, Y_hand, Z_hand).
8. GLASSES calculate target coordinate vector of "Cheeseburger" button.
9. GLASSES output spatial audio cues:
    ├── If hand is too far left: Pan high-pitch clicks to RIGHT ear.
    └── If hand is aligned: Output steady tone.
10. USER presses screen -> VIO registers contact -> Loop terminates.
```

---

## 5. Future Technology Roadmap & System Evolution

### 5.1 Neuromorphic (Event-Based) Vision Sensors
*   **Concept**: Traditional cameras capture entire frames at fixed rates (e.g., 30fps), processing static background pixels over and over, wasting energy.
*   **Future Shift**: Integrate event-based vision sensors (Silicon Retina). These sensors only record changes in pixel brightness (movement).
*   **System Value**: Cuts visual processing power from 200mW to under **5mW**, letting the glasses run spatial obstacle checks continuously on a tiny battery.

### 5.2 Liquid Neural Networks (LNNs)
*   **Concept**: Traditional neural networks have fixed weight parameters once trained. LNNs adapt their parameters over time based on continuous input data stream equations.
*   **System Value**: Drastically reduces model parameters for trajectory planning, allowing highly accurate path calculation to run on the low-power MCU co-processor directly.

### 5.3 Ultra-Wideband (UWB) Beacon Integration
*   **Concept**: Integrate UWB chips (similar to Apple Airtags) into public kiosks and transit points.
*   **System Value**: Provides sub-centimeter spatial relative anchoring. The glasses can locate a kiosk or a terminal even in absolute darkness, guiding the user's hand with zero vision processing overhead.
