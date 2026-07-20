export class BarcodeEngine {
  async scan(
    barcode: string,
  ) {
    return {
      found: false,

      barcode,
    };
  }

  async addAlternateBarcode(
    batchId: string,
    barcode: string,
  ) {
    console.log(
      "Add Alternate Barcode",
      batchId,
      barcode,
    );
  }
}

export const barcodeEngine =
  new BarcodeEngine();