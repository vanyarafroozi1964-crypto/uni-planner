import { AudioPlayer, createAudioPlayer } from 'expo-audio';

let player: AudioPlayer | null = null;

/** پخش صدای کوتاه آفلاین (فایل داخل اپ) */
export async function playDone(): Promise<void> {
  try {
    if (!player) player = createAudioPlayer(require('../assets/done.wav'));
    await player.seekTo(0);
    player.play();
  } catch {
    // پخش صدا نباید جریان اپ را مختل کند
  }
}
