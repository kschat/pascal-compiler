type HrTime = [number, number];

enum TimerState {
  Running,
  Paused,
  Stopped
}

class PerformanceTimer {
  private static readonly NANO_TO_MILLI = 1000000;
  private _startHrTime: HrTime = process.hrtime();
  private _pauseTime: number = 0;
  private _state: TimerState = TimerState.Stopped;

  constructor() { }

  public start(): this {
    if (this._state === TimerState.Running) {
      throw new Error('Performance timer already running');
    }

    if (this._state === TimerState.Paused) {
      this._state = TimerState.Running;
      return this;
    }

    return this.restart();
  }

  public restart(): this {
    this._state = TimerState.Running;
    this._startHrTime = process.hrtime();
    return this;
  }

  public pause(): this {
    this._state = TimerState.Paused;
    this._pauseTime = this.elaspedMilliseconds();
    return this;
  }

  public stop(): this {
    if (this._state === TimerState.Stopped) {
      throw new Error('Performance timer already stopped');
    }

    this._state = TimerState.Stopped;
    return this;
  }

  public elaspedMilliseconds(): number {
    if (this._state === TimerState.Stopped) {
      return 0;
    }

    if (this._state === TimerState.Paused) {
      return this._pauseTime;
    }

    return process.hrtime(this._startHrTime)[1] / PerformanceTimer.NANO_TO_MILLI;
  }
}

export { PerformanceTimer };
