/**
 * BLE UART Library
 * Provides functions to connect to BLE UART devices and handle data transmission/reception
 * with callback support for line-end detection
 */

class BLEUART {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.receiveBuffer = '';
    this.lineEndCallback = null;
    this.connectionCallback = null;
    this.disconnectionCallback = null;
    this.isConnected = false;
    
    // Nordic UART Service UUIDs
    this.UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    this.TX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write
    this.RX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Notify
  }

  /**
   * Connect to a BLE UART device
   * @param {Object} options - Optional filters for device selection
   * @returns {Promise} Resolves when connected
   */
  async connect(options = {}) {
    try {
      // Check if Web Bluetooth is available
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in this browser');
      }

      // Request device with UART service
      const requestOptions = {
        filters: options.filters || [{ services: [this.UART_SERVICE_UUID] }],
        optionalServices: [this.UART_SERVICE_UUID]
      };

      // If name prefix is provided, use it
      if (options.namePrefix) {
        requestOptions.filters = [{ namePrefix: options.namePrefix }];
        requestOptions.optionalServices = [this.UART_SERVICE_UUID];
      }

      console.log('Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice(requestOptions);

      console.log('Connecting to GATT Server...');
      this.server = await this.device.gatt.connect();

      console.log('Getting UART Service...');
      this.service = await this.server.getPrimaryService(this.UART_SERVICE_UUID);

      console.log('Getting Characteristics...');
      this.txCharacteristic = await this.service.getCharacteristic(this.TX_CHARACTERISTIC_UUID);
      this.rxCharacteristic = await this.service.getCharacteristic(this.RX_CHARACTERISTIC_UUID);

      // Start notifications for receiving data
      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener('characteristicvaluechanged', 
        this._handleDataReceived.bind(this));

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', 
        this._handleDisconnection.bind(this));

      this.isConnected = true;
      console.log('Connected to', this.device.name);

      // Call connection callback if set
      if (this.connectionCallback) {
        this.connectionCallback(this.device);
      }

      return this.device;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the BLE device
   */
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
      console.log('Disconnected from device');
    }
  }

  /**
   * Send data to the BLE device
   * @param {String|ArrayBuffer} data - Data to send
   */
  async send(data) {
    if (!this.isConnected || !this.txCharacteristic) {
      throw new Error('Not connected to a device');
    }

    try {
      let buffer;
      if (typeof data === 'string') {
        // Convert string to ArrayBuffer
        const encoder = new TextEncoder();
        buffer = encoder.encode(data);
      } else {
        buffer = data;
      }

      // BLE packets are typically limited to 20 bytes for compatibility
      const maxChunkSize = 20;
      for (let i = 0; i < buffer.length; i += maxChunkSize) {
        const chunk = buffer.slice(i, i + maxChunkSize);
        await this.txCharacteristic.writeValue(chunk);
      }
    } catch (error) {
      console.error('Send failed:', error);
      throw error;
    }
  }

  /**
   * Send a line of data (automatically adds newline)
   * @param {String} data - Data to send
   */
  async sendLine(data) {
    await this.send(data + '\n');
  }

  /**
   * Set callback function to be called when a complete line is received
   * @param {Function} callback - Function to call with the received line
   */
  onLineReceived(callback) {
    this.lineEndCallback = callback;
  }

  /**
   * Set callback function to be called when device connects
   * @param {Function} callback - Function to call on connection
   */
  onConnect(callback) {
    this.connectionCallback = callback;
  }

  /**
   * Set callback function to be called when device disconnects
   * @param {Function} callback - Function to call on disconnection
   */
  onDisconnect(callback) {
    this.disconnectionCallback = callback;
  }

  /**
   * Internal handler for received data
   * @private
   */
  _handleDataReceived(event) {
    const value = event.target.value;
    const decoder = new TextDecoder();
    const text = decoder.decode(value);
    
    // Add to buffer
    this.receiveBuffer += text;
    
    // Check for line endings and process complete lines
    let lineEndIndex;
    while ((lineEndIndex = this.receiveBuffer.indexOf('\n')) !== -1) {
      // Extract the line (without the newline character)
      const line = this.receiveBuffer.substring(0, lineEndIndex).trim();
      
      // Remove the processed line from buffer
      this.receiveBuffer = this.receiveBuffer.substring(lineEndIndex + 1);
      
      // Call the callback if set and line is not empty
      if (this.lineEndCallback && line.length > 0) {
        this.lineEndCallback(line);
      }
    }
    
    // Also check for carriage return
    while ((lineEndIndex = this.receiveBuffer.indexOf('\r')) !== -1) {
      const line = this.receiveBuffer.substring(0, lineEndIndex).trim();
      this.receiveBuffer = this.receiveBuffer.substring(lineEndIndex + 1);
      
      if (this.lineEndCallback && line.length > 0) {
        this.lineEndCallback(line);
      }
    }
  }

  /**
   * Internal handler for disconnection
   * @private
   */
  _handleDisconnection(event) {
    this.isConnected = false;
    console.log('Device disconnected');
    
    if (this.disconnectionCallback) {
      this.disconnectionCallback(event);
    }
  }

  /**
   * Check if device is connected
   * @returns {Boolean} Connection status
   */
  connected() {
    return this.isConnected && this.device && this.device.gatt.connected;
  }

  /**
   * Get device name
   * @returns {String} Device name or null
   */
  getDeviceName() {
    return this.device ? this.device.name : null;
  }

  /**
   * Clear the receive buffer
   */
  clearBuffer() {
    this.receiveBuffer = '';
  }
}

// Global instance for easy access (similar to p5.js style)
let bleUART = null;

/**
 * Initialize BLE UART connection
 * @param {Object} options - Optional connection options
 * @returns {BLEUART} BLE UART instance
 */
function createBLEUART(options = {}) {
  bleUART = new BLEUART();
  return bleUART;
}

/**
 * Connect to BLE UART device
 * @param {Object} options - Optional connection options
 */
async function connectBLE(options = {}) {
  if (!bleUART) {
    bleUART = new BLEUART();
  }
  return await bleUART.connect(options);
}

/**
 * Disconnect from BLE device
 */
function disconnectBLE() {
  if (bleUART) {
    bleUART.disconnect();
  }
}

/**
 * Send data via BLE
 * @param {String|ArrayBuffer} data - Data to send
 */
async function sendBLE(data) {
  if (bleUART) {
    await bleUART.send(data);
  }
}

/**
 * Send a line via BLE
 * @param {String} data - Data to send
 */
async function sendLineBLE(data) {
  if (bleUART) {
    await bleUART.sendLine(data);
  }
}

/**
 * Set callback for when a line is received
 * @param {Function} callback - Function to call with received line
 */
function onBLELineReceived(callback) {
  if (!bleUART) {
    bleUART = new BLEUART();
  }
  bleUART.onLineReceived(callback);
}

/**
 * Set callback for when device connects
 * @param {Function} callback - Function to call on connection
 */
function onBLEConnect(callback) {
  if (!bleUART) {
    bleUART = new BLEUART();
  }
  bleUART.onConnect(callback);
}

/**
 * Set callback for when device disconnects
 * @param {Function} callback - Function to call on disconnection
 */
function onBLEDisconnect(callback) {
  if (!bleUART) {
    bleUART = new BLEUART();
  }
  bleUART.onDisconnect(callback);
}
