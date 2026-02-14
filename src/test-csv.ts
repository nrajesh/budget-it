import Papa from "papaparse";

const csvContent = `Date;#;Account;Currency;Account Group;Counterparty;Transfer;Cat-SubCat;Category;Sub-Category;M-YYYY;Amount;EUR;Running Balance;Notes
01/01/2025;1;Rajesh Euro;EUR;Primary;;Navi EUR;Transfer;Transfer;;1-2025;-10,00;-10,00;15,90;
01/01/2025;2;Navi EUR;EUR;Kids;;Rajesh Euro;Transfer;Transfer;;1-2025;10,00;10,00;140,40;`;

Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  delimiter: ";", // Explicit semicolon
  complete: (results) => {
    console.log("Parsed Rows:", results.data.length);
    console.log("Headers:", results.meta.fields);
    if (results.data.length > 0) {
      console.log("First Row:", results.data[0]);
    }
  },
  error: (err: unknown) => console.error(err),
});
