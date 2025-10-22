import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

import { AdsenseModule } from 'ng2-adsense';
import { ADSENSE_CONFIG, AdsenseConfig } from '../../app.config';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, AdsenseModule, FormsModule, SelectModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing implements OnInit, OnDestroy {
  protected readonly title = signal('chess-timekeeper');
  // readonly publisherId: string;
  imageUrlPrefix: string;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.theme = localStorage.getItem('theme') || 'light';
    }
  }

  // time options are total game minutes (split equally)
  timeOptions = [
    { label: '10 minutes (5m each)', value: 10 },
    { label: '20 minutes (10m each)', value: 20 },
    { label: '30 minutes (15m each)', value: 30 },
    { label: '2 hours (1h each)', value: 120 },
    { label: '5 hours (2.5h each)', value: 300 }
  ];

  // UI state
  selectedOption = 10; // default 10 minutes
  customInput: number | null = null;
  treatAsHours = false;
  soundOn = true;
  themes = ['light', 'dark', 'wooden'];
  theme: string = 'light';

  // timers (in seconds)
  totalSeconds = 10 * 60; // total
  eachSeconds = 5 * 60; // for display
  times: number[] = [5 * 60, 5 * 60];

  // runtime state
  activePlayer: number | null = null; // 0 or 1
  running = false;
  paused = false;
  intervalId: any = null;
  timeUpFor: number | null = null; // which player time up

  // audio
  alarmAudio: HTMLAudioElement | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(ADSENSE_CONFIG) private adsenseConfig: AdsenseConfig
  ) {
    this.imageUrlPrefix = environment.imageUrlPrefix;
    // console.log('Adsense Publisher ID:', this.adsenseConfig.publisherId);
    // this.publisherId = this.adsenseConfig.publisherId;
    this.loadPreferences();
    this.setupInitialTimes();
    // set alarmAudio via DOM after initial render (querySelector) - but here we'll create Audio fallback
    try {
      this.alarmAudio = new Audio();
      // small beep as data-url not containing actual beep by default; you can replace src with a real file
      this.alarmAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
    } catch (e) {
      this.alarmAudio = null;
    }
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }

  setupInitialTimes() {
    this.totalSeconds = (this.selectedOption || 10) * 60;
    const each = Math.floor(this.totalSeconds / 2);
    this.eachSeconds = each;
    this.times = [each, each];
    this.timeUpFor = null;
    this.activePlayer = null;
    this.paused = false;
    this.running = false;
    this.clearInterval();
  }

  selectOption(opt: {label:string, value:number}) {
    this.selectedOption = opt.value;
    this.saveToLocal('selectedOption', opt.value);
    this.setupInitialTimes();
  }

  setCustomTime() {
    if (!this.customInput || this.customInput <= 0) return;
    let minutes = Number(this.customInput);
    if (this.treatAsHours) minutes = minutes * 60;
    this.selectedOption = minutes;
    this.saveToLocal('selectedOption', minutes);
    this.setupInitialTimes();
  }

  startManual() {
    if (this.running) return;
    this.activePlayer = 0; // start with Player A by default
    this.running = true;
    this.paused = false;
    this.beginInterval();
  }

  pressButton(playerIndex: number) {
    if (this.timeUpFor !== null) return; // ignore when game ended

    // If not running -> start the opponent's clock? Behavior choice: when pressing your button you end your turn and start opponent.
    if (!this.running) {
      // Start the pressed player's clock (begin game)
      this.activePlayer = playerIndex;
      this.running = true;
      this.paused = false;
      this.beginInterval();
      return;
    }

    // If running and activePlayer is the pressed player's turn -> pressing should end your turn and start opponent
    if (this.activePlayer === playerIndex) {
      // switch to opponent
      this.activePlayer = 1 - playerIndex;
      return; // interval already running will now affect new activePlayer on next tick
    } else {
      // If you press during opponent's turn, make it your turn
      this.activePlayer = playerIndex;
    }
  }

  beginInterval() {
    this.clearInterval();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    if (!this.running || this.paused || this.activePlayer === null) return;
    const p = this.activePlayer;
    if (this.times[p] <= 0) {
      // already zero
      this.handleTimeUp(p);
      return;
    }

    this.times[p] = this.times[p] - 1;

    if (this.times[p] <= 0) {
      this.times[p] = 0;
      this.handleTimeUp(p);
    }
  }

  handleTimeUp(player: number) {
    this.timeUpFor = player;
    this.running = false;
    this.clearInterval();
    if (this.soundOn && this.alarmAudio) {
      try { this.alarmAudio.play(); } catch (e) { /* ignore */ }
    }
  }

  togglePause() {
    if (this.timeUpFor !== null) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.clearInterval();
    } else {
      if (this.running) this.beginInterval();
      else { this.running = true; this.beginInterval(); }
    }
  }

  reset() {
    this.setupInitialTimes();
  }

  addIncrement(player: number, seconds: number) {
    this.times[player] += seconds;
  }

  formatSeconds(sec: number) {
    if (sec == null) return '00:00:00';
    // show H:MM:SS if > 1 hour
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }
    return `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  }

  savePreferences() {
    this.saveToLocal('theme', this.theme);
    this.saveToLocal('selectedOption', this.selectedOption);
    // quick user feedback (could be replaced by toast)
    alert('Preferences saved');
  }

  saveToLocal(key: string, value: any) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
  }

  loadPreferences() {
    try {
      const t = localStorage.getItem('theme');
      if (t) this.theme = JSON.parse(t);
      const s = localStorage.getItem('selectedOption');
      if (s) this.selectedOption = JSON.parse(s);
    } catch (e) { }
  }

  applyTheme() {
    this.saveToLocal('theme', this.theme);
  }

  get themeClass() {
    return this.theme || 'light';
  }

  get eachSecondsComputed() {
    return Math.floor(this.totalSeconds / 2);
  }

  // utility
  get totalSecondsDisplay() { return this.totalSeconds; }

  // Keyboard shortcut handling
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === ' ') { // Space: switch turn
      event.preventDefault();
      if (this.timeUpFor !== null) return;
      // if not running start with player A
      if (!this.running) { this.pressButton(0); return; }
      // if running, switch to other player
      if (this.activePlayer === null) { this.activePlayer = 0; return; }
      this.activePlayer = 1 - this.activePlayer;
    }
    if (event.key.toLowerCase() === 'r') {
      this.reset();
    }
    if (event.key.toLowerCase() === 'p') {
      this.togglePause();
    }
  }
}
