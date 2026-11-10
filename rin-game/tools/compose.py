import sys, subprocess, numpy as np
from synth import *

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/bgm/out'
ONLY = sys.argv[2:]  # 只渲染指定曲目


def save(name, x):
    import scipy.io.wavfile as wf
    wav = f'{OUT}/{name}.wav'; wf.write(wav, SR, (x.T * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '112k', f'{OUT}/{name}.mp3'], check=True)
    print(name, round(x.shape[1] / SR, 1), 's')


def bars_of(prog, n): return [prog[i % len(prog)] for i in range(n)]


def pad_layer(T, prog, n, inst=pad, low=55, gain=0.16, pan=0.0, start=0):
    for b, c in enumerate(bars_of(prog, n)):
        for m in voice(c, low): T.note(inst, m, start + b, 0, T.beats, pan=pan + R.normal(0, .15), gain=gain)


def arp_layer(T, prog, n, inst=harp, low=50, pattern=(0, 1, 2, 3, 2, 1), step=0.5, gain=0.2, start=0, pan=-0.3):
    for b, c in enumerate(bars_of(prog, n)):
        v = voice(c, low); tones = v + [x + 12 for x in v]
        for i, p in enumerate(pattern):
            if i * step >= T.beats: break
            T.note(inst, tones[p % len(tones)], start + b, i * step, step * 2, pan=pan, gain=gain, vel=1 - 0.15 * (i % 2))


def bass_layer(T, prog, n, inst=pizz, low=38, beats=(0,), gain=0.32, fifth_on=(), start=0):
    for b, c in enumerate(bars_of(prog, n)):
        r = bassnote(c, low)
        for bt in beats: T.note(inst, r, start + b, bt, 1, gain=gain)
        for bt in fifth_on: T.note(inst, r + 7, start + b, bt, 1, gain=gain * 0.8)


def tick_layer(T, n, every=1.0, start=0, gain=1.0, alt=True):
    k = 0
    for b in range(n):
        x = 0.0
        while x < T.beats - 1e-6:
            T.add((tock if (alt and k % 2) else tick)(gain), T.at(start + b, x), pan=0.25 if k % 2 else -0.25, human=0.002); k += 1; x += every


# ============ 標題／地圖：主題曲 ============
def title():
    T = Track(84, 3, 32); P = ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'F', 'Gm', 'A']
    M = "A4:1 D5:1 E5:1 | F5:1.5 E5:.5 D5:1 | D5:1 Bb4:1 G4:1 | A4:2 C#5:1 | D5:1 F5:1 A5:1 | C6:1.5 Bb5:.5 A5:1 | G5:1 E5:1 D5:.5 E5:.5 | C#5:2 A4:1"
    pad_layer(T, P, 32, gain=0.13)
    arp_layer(T, P, 32, gain=0.17)
    bass_layer(T, P, 32, gain=0.3)
    tick_layer(T, 32, gain=0.4)
    T.melody(musicbox, M, 0, pan=0.15, gain=0.5)
    T.melody(celesta, M, 8, pan=0.1, gain=0.42); T.melody(flute, M, 8, pan=-0.2, gain=0.22, octave=-1)
    pad_layer(T, P, 8, inst=strings, low=62, gain=0.08, start=8)
    T.melody(horn, "D4:3 | F4:3 | G4:2 Bb4:1 | A4:3 | D4:3 | C4:3 | Bb3:2 G3:1 | A3:3", 16, gain=0.28, pan=-0.1)
    pad_layer(T, P, 8, inst=choir, low=50, gain=0.1, start=16)
    T.melody(musicbox, M, 24, pan=0.2, gain=0.45, octave=1); T.melody(celesta, M, 24, pan=-0.1, gain=0.3)
    return T.render(rt=0.55)


# ============ 第一章：藍紫森林 ============
def act1():
    T = Track(66, 3, 24); P = ['Em', 'Cmaj7', 'Am9', 'Bsus4', 'Em', 'Cmaj7', 'D', 'Bsus4']
    pad_layer(T, P, 24, gain=0.13, low=52)
    arp_layer(T, P, 24, low=52, pattern=(0, 2, 4, 5, 4, 2), gain=0.2, pan=-0.25)
    arp_layer(T, P, 24, inst=harp, low=64, pattern=(4, 3), step=1.5, gain=0.07, pan=0.4)
    M = "B4:3 | E5:2 D5:1 | C5:2 B4:1 | B4:3 | G5:2 F#5:1 | E5:2 B4:1 | D5:1.5 E5:1.5 | F#5:3"
    T.melody(flute, M, 8, gain=0.3, pan=0.15); T.melody(flute, M, 16, gain=0.24, pan=0.1, octave=1)
    pad_layer(T, P, 8, inst=choir, low=59, gain=0.08, start=16)
    for _ in range(26):
        T.note(bell, int(R.choice([88, 91, 95, 98, 100])), int(R.integers(0, 24)), float(R.integers(0, 6)) / 2, 1, pan=float(R.uniform(-.8, .8)), gain=0.07)
    bass_layer(T, P, 24, inst=bowedbass, low=33, gain=0.16)
    return T.render(rt=0.7, wet=0.4)


# ============ 第二章：城門 ============
def act2():
    T = Track(72, 4, 24); P = ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Eb', 'Ab', 'G']
    for b, c in enumerate(bars_of(P, 24)):
        r = bassnote(c, 36)
        for i in range(8): T.note(bowedbass, r + (12 if i in (3, 7) else 0), b, i * 0.5, 0.45, gain=0.2, vel=1.15 if i % 4 == 0 else 0.85)
        T.add(timpani(m2f(r - 12 if r > 40 else r), 0.9), T.at(b, 0), gain=0.35)
        if b % 2: T.add(timpani(m2f(bassnote(c, 36) + 7 - 12), 0.5), T.at(b, 2), gain=0.25)
    pad_layer(T, P, 24, inst=strings, low=55, gain=0.1)
    M = "G4:2 C5:1 D5:1 | Eb5:3 C5:1 | F5:2 Eb5:1 D5:1 | D5:3 B4:1 | C5:2 Eb5:1 G5:1 | Bb5:2 G5:2 | Ab5:1 G5:1 F5:1 Eb5:1 | D5:4"
    T.melody(horn, M, 8, gain=0.4, pan=-0.1, octave=-1)
    T.melody(horn, M, 16, gain=0.34, pan=-0.1); T.melody(strings, M, 16, gain=0.16, pan=0.2)
    pad_layer(T, P, 8, inst=choir, low=48, gain=0.1, start=16)
    return T.render(rt=0.6, wet=0.36)


# ============ 第三章：情報商（黑色偵探） ============
def act3():
    T = Track(90, 4, 24); P = ['Am9', 'Fmaj7', 'Dm9', 'E7b9']
    nxt = lambda i: bassnote(bars_of(P, 25)[i + 1], 33)
    for b, c in enumerate(bars_of(P, 24)):
        r = bassnote(c, 33); root, iv, _ = chord(c)
        for i, m in enumerate([r, r + iv[1], r + 7, nxt(b) - 1 if nxt(b) - 1 != r else r + 10]): T.note(pizz, m, b, i, 1, gain=0.42)
        for bt in (1.5, 3): [T.note(ep, m, b, bt, 0.6, pan=0.2, gain=0.15, vel=0.9) for m in voice(c, 57)[1:]]
        for i in range(8): T.add(hat(0.9 if i % 2 else 0.5), T.at(b, i * 0.5), pan=0.4, human=0.003)
        T.add(tick(0.6), T.at(b, 3.75), pan=-0.4)
    M = "E5:1.5 C5:.5 A4:1 B4:1 | C5:2 E5:1 G5:1 | F5:1.5 E5:.5 D5:1 C5:1 | B4:3 G#4:1 | A4:1 C5:1 E5:1 A5:1 | G5:1.5 F5:.5 E5:2 | D5:1 F5:1 A5:1 C6:1 | B5:2 G#5:2"
    T.melody(vibes, M, 8, gain=0.34, pan=-0.15)
    for b, c in enumerate(bars_of(P, 8)):
        v = voice(c, 69)
        for i in range(16): T.note(square, v[i % len(v)], 16 + b, i * 0.25, 0.22, pan=0.5 if i % 2 else -0.5, gain=0.05)
    T.melody(vibes, M, 16, gain=0.28, pan=0.1, octave=-1)
    pad_layer(T, P, 24, low=52, gain=0.07)
    return T.render(rt=0.45, wet=0.28)


# ============ 第四章：圖書館 ============
def act4():
    T = Track(76, 3, 24)
    P = ['Bm', 'Bm/A#', 'Bm/A', 'G#m7b5', 'Gmaj7', 'Em9', 'F#sus4', 'F#7']
    tick_layer(T, 24, gain=0.45)
    bass_layer(T, P, 24, inst=bowedbass, low=35, gain=0.22)
    pad_layer(T, P, 24, inst=choir, low=54, gain=0.08)
    M = "F#5:1 D5:1 B4:1 | C#5:1.5 D5:.5 E5:1 | D5:1 C#5:1 B4:1 | B4:2 G#4:1 | G4:1 B4:1 D5:1 | F#5:2 E5:1 | D5:1 C#5:1 B4:1 | A#4:3"
    T.melody(musicbox, M, 0, gain=0.5, pan=0.15)
    T.melody(celesta, M, 8, gain=0.42, pan=0.1, octave=1)
    T.melody(pizz, "B3:1 r:2 | A#3:1 r:2 | A3:1 r:2 | G#3:1 r:2 | G3:1 B3:1 D4:1 | E4:3 | F#4:1 r:2 | C#4:1 A#3:1 F#3:1", 8, gain=0.25, pan=-0.3)
    for b in range(16, 24, 2): T.note(bell, int(R.choice([83, 86, 90])), b, 1, 1, pan=float(R.uniform(-.6, .6)), gain=0.12)
    T.melody(musicbox, "F#5:3 | r:3 | D5:3 | r:3 | B4:3 | r:3 | C#5:3 | r:3", 16, gain=0.3)
    return T.render(rt=0.65, wet=0.4)


# ============ 第五章：占卜店 ============
def act5():
    T = Track(68, 4, 24); P = ['A', 'Bb', 'A', 'Gm']
    ost = {'A': "A3 C#4 E4 F4 E4 C#4 Bb3 C#4", 'Bb': "Bb3 D4 F4 G4 F4 D4 C#4 D4", 'Gm': "G3 Bb3 D4 E4 D4 Bb3 A3 C#4"}
    for b, c in enumerate(bars_of(P, 24)):
        for i, n in enumerate(ost[c].split()): T.note(dulcimer, nm(n), b, i * 0.5, 0.9, pan=-0.3 if i % 2 else 0.1, gain=0.22, vel=1.1 if i % 4 == 0 else 0.85)
        if b % 4 == 0: T.note(drone, 33, b, 0, 16, gain=0.22); T.note(drone, 40, b, 0, 16, gain=0.12, pan=0.3)
        if b % 2 == 0 and b >= 8: T.add(cymbal(0.5), T.at(b, 0), pan=0.5)
    M = "E5:2 F5:1 E5:1 | D5:2 C#5:2 | E5:1 F5:1 G5:1 A5:1 | Bb5:2 A5:2 | G5:1 F5:1 E5:1 D5:1 | C#5:2 D5:1 E5:1 | F5:1 E5:1 D5:1 C#5:1 | E5:4"
    T.melody(flute, M, 8, gain=0.3, pan=0.15, octave=-1)
    T.melody(choir, M, 16, gain=0.2, pan=-0.1); T.melody(flute, M, 16, gain=0.2, pan=0.2)
    pad_layer(T, P, 24, inst=choir, low=52, gain=0.06)
    return T.render(rt=0.7, wet=0.42)


# ============ 第六章：煉金坊 ============
def act6():
    T = Track(112, 4, 24); P = ['Gm', 'D7', 'Gm', 'Cm', 'Eb', 'Cm', 'D', 'D7']
    for b, c in enumerate(bars_of(P, 24)):
        r = bassnote(c, 36); v = voice(c, 55)
        T.note(pizz, r, b, 0, 1, gain=0.42); T.note(pizz, r + 7, b, 2, 1, gain=0.36)
        for bt in (1, 3): [T.note(pizz, m, b, bt, 0.5, gain=0.16, pan=0.25) for m in v]
        if R.random() < 0.6: T.add(bloop(1), T.at(b, float(R.choice([1.5, 2.5, 3.5]))), pan=float(R.uniform(-.7, .7)), gain=0.25)
    M = "D5:.5 G5:.5 Bb5:.5 A5:.5 G5:1 D5:1 | C5:.5 D5:.5 Eb5:.5 F#5:.5 A5:2 | G5:.5 F5:.5 Eb5:.5 D5:.5 Bb4:1 G4:1 | C5:1 Eb5:1 D5:1 A4:1 | Bb4:.5 Eb5:.5 G5:.5 Bb5:.5 G5:1 Eb5:1 | C5:.5 Eb5:.5 G5:.5 C6:.5 Bb5:2 | A5:.5 F#5:.5 D5:.5 A4:.5 C5:1 Bb4:1 | A4:2 F#4:2"
    T.melody(celesta, M, 0, gain=0.42, pan=0.15)
    T.melody(celesta, M, 8, gain=0.36, pan=0.1); T.melody(horn, "G3:4 | F#3:4 | G3:4 | C3:2 D3:2 | Eb3:4 | C3:4 | D3:4 | D3:4", 8, gain=0.22, pan=-0.3)
    T.melody(musicbox, M, 16, gain=0.32, octave=1, pan=-0.1)
    pad_layer(T, P, 24, low=55, gain=0.05)
    return T.render(rt=0.45, wet=0.3)


# ============ 第七章：深夜酒吧（爵士圓舞曲） ============
def act7():
    T = Track(100, 3, 32); P = ['Dm9', 'Gm9', 'C9', 'Fmaj7', 'Bbmaj7', 'Em7b5', 'A7b9', 'Dm6']
    for b, c in enumerate(bars_of(P, 32)):
        r = bassnote(c, 33); T.note(pizz, r, b, 0, 1, gain=0.45)
        if b % 2: T.note(pizz, r + 7, b, 2, 1, gain=0.3)
        for bt in (1, 2): [T.note(ep, m, b, bt, 0.8, pan=0.15, gain=0.13, vel=0.85) for m in voice(c, 57)[1:]]
        for bt in range(3): T.add(brush(1.3 if bt == 0 else 0.8), T.at(b, bt), pan=-0.3, human=0.004)
    M = "A5:2 F5:1 | D5:2 Bb4:1 | E5:1.5 D5:.5 E5:1 | C5:3 | D5:1 F5:1 A5:1 | G5:2 Bb4:1 | C#5:1.5 E5:.5 G5:1 | F5:3"
    T.melody(vibes, M, 8, gain=0.34, pan=-0.1); T.melody(vibes, M, 16, gain=0.28, pan=0.1, octave=-1)
    T.melody(flute, M, 24, gain=0.16, pan=0.25, octave=-1); T.melody(vibes, M, 24, gain=0.22)
    return T.render(rt=0.4, wet=0.24)


# ============ 第八章：劇場大廳 ============
def act8():
    T = Track(80, 4, 24); P = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B']
    pad_layer(T, P, 24, inst=strings, low=55, gain=0.11)
    arp_layer(T, P, 24, low=52, pattern=(0, 1, 2, 3, 4, 5, 4, 3), step=0.5, gain=0.15, pan=-0.3)
    bass_layer(T, P, 24, inst=bowedbass, low=33, gain=0.2)
    for b in range(24):
        if b % 2 == 0: T.note(bell, bassnote(bars_of(P, 24)[b], 76), b, 0, 2, gain=0.1, pan=0.4)
        if b % 8 == 7:
            for i in range(16): T.add(timpani(m2f(40), 0.25 + 0.04 * i), T.at(b, i * 0.25), gain=0.25, human=0)
    M = "B4:2 E5:1 F#5:1 | G5:3 E5:1 | D5:2 B4:1 G4:1 | A4:4 | B4:2 E5:1 G5:1 | C6:3 B5:1 | A5:2 C6:1 E5:1 | D#5:4"
    T.melody(strings, M, 8, gain=0.22, pan=0.15)
    T.melody(strings, M, 16, gain=0.2, pan=0.15, octave=1); T.melody(horn, M, 16, gain=0.2, pan=-0.15)
    pad_layer(T, P, 8, inst=choir, low=55, gain=0.1, start=16)
    return T.render(rt=0.65, wet=0.38)


# ============ 終章 ============
def finale():
    T = Track(72, 3, 24); P = ['D', 'Bm', 'G', 'A', 'D', 'F#m', 'G', 'Asus4']
    M = "A4:1 D5:1 E5:1 | F#5:1.5 E5:.5 D5:1 | D5:1 B4:1 G4:1 | A4:2 C#5:1 | D5:1 F#5:1 A5:1 | A5:1.5 G5:.5 F#5:1 | G5:1 E5:1 D5:.5 E5:.5 | E5:3"
    pad_layer(T, P, 24, gain=0.13)
    arp_layer(T, P, 24, low=50, gain=0.18)
    bass_layer(T, P, 24, inst=bowedbass, low=38, gain=0.2)
    T.melody(celesta, M, 0, gain=0.45, pan=0.1)
    T.melody(flute, M, 8, gain=0.3, pan=-0.1); T.melody(strings, M, 8, gain=0.14, pan=0.2, octave=-1)
    pad_layer(T, P, 16, inst=choir, low=57, gain=0.09, start=8)
    T.melody(musicbox, M, 16, gain=0.36, octave=1)
    return T.render(rt=0.7, wet=0.42)


ALL = dict(title=title, act1=act1, act2=act2, act3=act3, act4=act4, act5=act5, act6=act6, act7=act7, act8=act8, finale=finale)
import os; os.makedirs(OUT, exist_ok=True)
for k, f in ALL.items():
    if ONLY and k not in ONLY: continue
    save(k, f())
