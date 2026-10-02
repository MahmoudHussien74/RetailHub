import { Directive, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

/**
 * Listens for barcode scanner input globally (Keyboard Wedge mode).
 * Differentiates scanner input (fast, < 50ms between chars) from human typing.
 * Emits the full barcode string when Enter/Tab is pressed after fast input.
 */
@Directive({
  selector: '[appBarcodeListener]',
  standalone: true
})
export class BarcodeListenerDirective implements OnInit, OnDestroy {
  @Output() barcodeScanned = new EventEmitter<string>();

  private buffer = '';
  private lastKeyTime = 0;
  private readonly MAX_INTERVAL_MS = 60; // max ms between keystrokes for scanner
  private readonly MIN_LENGTH = 3;       // minimum barcode length
  private keyHandler!: (e: KeyboardEvent) => void;
  private emitTimeout: any;

  ngOnInit(): void {
    this.keyHandler = (e: KeyboardEvent) => this.handleKeyPress(e);
    document.addEventListener('keydown', this.keyHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keyHandler);
    clearTimeout(this.emitTimeout);
  }

  private handleKeyPress(event: KeyboardEvent): void {
    const now = Date.now();
    const target = event.target as HTMLElement;

    // Skip if user is actively typing in an input field (except search fields)
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const isSearchInput = target.classList.contains('barcode-search');
      if (!isSearchInput) return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      clearTimeout(this.emitTimeout);
      if (this.buffer.length >= this.MIN_LENGTH) {
        event.preventDefault();
        this.barcodeScanned.emit(this.buffer);
      }
      this.buffer = '';
      return;
    }

    // Only accept printable characters
    if (event.key.length !== 1) return;

    const timeDiff = now - this.lastKeyTime;
    if (timeDiff > this.MAX_INTERVAL_MS && this.buffer.length > 0) {
      // Too slow — reset (likely human typing)
      this.buffer = '';
    }

    this.buffer += event.key;
    this.lastKeyTime = now;

    // Automatic fallback: if barcode scanner does not send Enter, auto-emit after 80ms
    clearTimeout(this.emitTimeout);
    this.emitTimeout = setTimeout(() => {
      if (this.buffer.length >= this.MIN_LENGTH) {
        this.barcodeScanned.emit(this.buffer);
      }
      this.buffer = '';
    }, 80);
  }
}
