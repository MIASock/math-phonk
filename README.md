# Math Phonk

Type math functions and they become the instruments. Each curve is drawn, and its graph is the waveform you hear.

**Try it live: https://miasock.github.io/math-phonk/**

## Run locally

Serve the folder with any static server and open http://localhost:5178:

```bash
python -m http.server 5178
```

## How a curve becomes sound

- Every curve (up to 4, sharing one graph) is an oscillator running in an AudioWorklet. Each cycle of the oscillator walks x across the curve's **wave window** and outputs f(x, t), normalized to [-1, 1]. Nothing else shapes the tone.
- The window slides from the left edge to the right edge over one sweep, so the timbre follows whatever shape is under the playhead. With **Whole graph**, the waveform is the entire visible curve.
- If the window contains n bumps, you hear n× the pitch. Jumps and corners sound buzzy, smooth curves sound soft, and `noise()` works as a hi-hat.
- **Pitch** has two modes per curve: **Key note** follows the chord progression, and **Follow curve** quantizes f at the playhead to the scale.
- **Rhythm** has these options per curve: 808 (on the kick, with a pitch drop), Phonk 3-3-2, 8ths, 16ths, offbeat, or a held drone.
- `t` is playback time in seconds, so curves that use t morph their sound while they move.

## Story kits

Some kits model real situations where the curves cause each other. Name a curve (`coffee(x) = …`) and that name appears in the video. A kit's caption says what x means.

- **Your morning coffee** (x = minutes): Newton's law of cooling, caffeine absorption and elimination (the Bateman function, half-life of about 5 h), and heart rate following caffeine.
- **24 hours of your day** (x = hour): sunlight, phone battery, alertness (circadian rhythm with the post-lunch dip), and rush-hour traffic.
- **Reactor meltdown · Chernobyl 1986** (x = seconds into the test): the turbine slows down, coolant turns to steam, the power excursion follows, and the AZ-5 control rods jam a third of the way in.
- **Atom bomb · the last 2 minutes** (x = seconds from detonation): a countdown riser, the double flash, the Taylor–Sedov fireball (R ∝ t^0.4), and the Friedlander blast wave.

- **Black hole merger · GW150914** (x = seconds to merger, time-stretched): the gravitational-wave chirp (frequency ∝ τ^-3/8), the orbit at half that frequency (so exactly an octave lower), and the ringdown.
- **Supernova · where your iron comes from** (x = days): the light curve powered by the decay chain Ni-56 → Co-56 → Fe-56, where the three always sum to 1.
- **Tsunami · the last 100 km** (x = km from shore): speed √(g·depth) and Green's law (height ∝ depth^-1/4) as the sea floor rises.
- **Rocket launch · Max Q** (x = seconds after liftoff): altitude, dynamic pressure q = ½ρv² peaking at Max Q, acceleration rising as fuel burns, and the engine roar cutting out at engine cutoff.

The models are simplified for clarity, but each formula's shape comes from the real physics.

## Famous math (for the classroom)

- **Fourier series:** partial sums of sin(nx)/n turn a sine into a square wave. Each added term sounds brighter, and you can see the Gibbs overshoot.
- **Taylor series of sin(x):** x, x − x³/3!, x − x³/3! + x⁵/5!. All of them sound like the sine near 0 and drift apart toward the edges.
- **Fibonacci · Binet's formula:** one smooth curve that hits every Fibonacci number at whole x, so the melody climbs through them.
- **Prime number theorem:** `primes(x)` counts the primes up to x and plays a step for each one, against Gauss's x / ln(x) estimate and the error between them.

## Sharing

**Copy share link** puts the whole setup into the URL after `#s=` (curves, settings, caption, layout). Nothing is uploaded anywhere. Opening the link loads that setup without touching the recipient's own saved work until they start editing it. Links point at wherever the app is running, so to share with other people the app has to be hosted somewhere they can reach (any static host works).

## Recording

Use **9:16 Reels** with **Record one sweep** to get an MP4 (Chrome/Edge) or WebM (Firefox) of exactly one pass. Keep the tab in the foreground while recording, because background tabs throttle the sequencer.
