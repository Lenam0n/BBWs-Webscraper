const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const readline = require("readline");

// Array, um alle gescrapten Daten zu sammeln
let allScrapedData = [];
let Adresses = [];

// Funktion zum Extrahieren von Daten aus der Webseite
async function scrapeData(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Titel finden
    const title = $("span.document-title__headline").text().trim();
    const website = $("a.document-title__link").attr("href");
    const addressBlock = $(".bbw-detail__content-main")
      .first()
      .find("p")
      .html();

    // Überprüfen, ob die benötigten Felder vorhanden sind, bevor trim() oder split() aufgerufen werden
    const scrapedData = {
      title: title ? title.trim() : "Titel nicht gefunden",
      website: website || "Website nicht gefunden",
      address: addressBlock
        ? {
            street: addressBlock.split("<br>")[0].trim(),
            city:
              addressBlock.split("<br>")[1]?.trim() || "Stadt nicht gefunden",
            region:
              addressBlock.split("<br>")[2]?.trim() || "Region nicht gefunden",
          }
        : {
            street: "Straße nicht gefunden",
            city: "Stadt nicht gefunden",
            region: "Region nicht gefunden",
          },
      carrier:
        $(".bbw-detail__content-main").eq(1).text().trim() ||
        "Träger nicht gefunden",
      specializations: [],
      contacts: [],
    };

    // Spezialiserungen (Behinderungsarten)
    $(".bbw-detail__section")
      .find("ul")
      .first()
      .find("li")
      .each((i, elem) => {
        scrapedData.specializations.push($(elem).text().trim());
      });

    $(".bbw-detail__contact").each((i, elem) => {
      const contactName =
        $(elem).find(".bbw-detail__contact-name").text().trim() ||
        "Kontaktname nicht gefunden";

      // Extrahiere den Textblock
      const contactPhoneBlock = $(elem).find("p").text();

      const contactPhone = contactPhoneBlock
        ? contactPhoneBlock
            .replace(/\s+/g, "") // Entfernt alle Leerzeichen
            .replace(/^.*T/, "") // Entfernt alles vor dem 'T'
            .replace(/[^0-9+]/g, "") // Erlaubt nur Zahlen und das Pluszeichen, entfernt alles andere (einschließlich '/')
            .replace(/\+/g, (match, offset) => (offset === 0 ? "+" : "")) // Behaltet das + nur, wenn es am Anfang steht
        : "Telefon nicht gefunden";

      const contactEmail = $(elem)
        .find('a[href^="javascript:linkTo_UnCryptMailto"]')
        .text()
        .replace("(at)", "@")
        .replace("(dot)", ".");

      // Füge Kontaktobjekt zum contacts Array hinzu
      scrapedData.contacts.push({
        name: contactName,
        phone: contactPhone,
        email: contactEmail || "E-Mail nicht gefunden",
      });
    });

    // Füge die gescrapten Daten dem Array hinzu
    allScrapedData.push(scrapedData);
  } catch (error) {
    console.error("Fehler beim Scrapen:", error);
  }
}

// Funktion zum Speichern der gescrapten Daten in einer JSON-Datei
function saveToJSON() {
  const filePath = path.join(__dirname, "scrapedData.json");

  // Überprüfen, ob die Datei existiert oder leer ist
  fs.readFile(filePath, "utf8", (err, fileData) => {
    let jsonData = [];

    if (err) {
      if (err.code === "ENOENT") {
        // Datei existiert nicht, also erstellen wir sie
        console.log("Datei existiert nicht, erstelle neue Datei.");
      } else {
        console.error("Fehler beim Lesen der Datei:", err);
        return;
      }
    }

    // Wenn Datei existiert und Daten enthält, parse die Daten
    if (fileData) {
      try {
        jsonData = JSON.parse(fileData);
        if (!Array.isArray(jsonData)) {
          jsonData = []; // Falls das JSON-Format nicht einem Array entspricht, initialisiere es als Array
        }
      } catch (err) {
        console.error(
          "Fehler beim Parsen der JSON-Datei. Verwende leeres Array."
        );
      }
    }

    // Füge die neuen Daten zum bestehenden JSON-Array hinzu
    jsonData = [...jsonData, ...allScrapedData];

    // Schreibe die Daten in die Datei
    fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error("Fehler beim Speichern der Datei:", err);
      } else {
        console.log(`Daten wurden erfolgreich in ${filePath} gespeichert.`);
      }
    });
  });
}

// Funktion zum Speichern der Adressen in einer JSON-Datei
function saveAddresses() {
  const filePath = path.join(__dirname, "addressList.json");

  // Überprüfen, ob die Datei existiert oder leer ist
  fs.readFile(filePath, "utf8", (err, fileData) => {
    let jsonData = [];

    if (err) {
      if (err.code === "ENOENT") {
        // Datei existiert nicht, also erstellen wir sie
        console.log("Adresse-Datei existiert nicht, erstelle neue Datei.");
      } else {
        console.error("Fehler beim Lesen der Datei:", err);
        return;
      }
    }

    // Wenn Datei existiert und Daten enthält, parse die Daten
    if (fileData) {
      try {
        jsonData = JSON.parse(fileData);
        if (!Array.isArray(jsonData)) {
          jsonData = []; // Falls das JSON-Format nicht einem Array entspricht, initialisiere es als Array
        }
      } catch (err) {
        console.error(
          "Fehler beim Parsen der JSON-Datei. Verwende leeres Array."
        );
      }
    }

    // Filter, um nur neue Adressen hinzuzufügen (keine Duplikate)
    const newAdresses = Adresses.filter(
      (address) => !jsonData.includes(address)
    );

    if (newAdresses.length > 0) {
      // Füge die neuen Adressen zum bestehenden JSON-Array hinzu
      jsonData = [...jsonData, ...newAdresses];

      // Schreibe die Adressen in die Datei
      fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error("Fehler beim Speichern der Adresse-Datei:", err);
        } else {
          console.log(
            `Adressen wurden erfolgreich in ${filePath} gespeichert.`
          );
        }
      });
    } else {
      console.log("Keine neuen Adressen zum Hinzufügen.");
    }
  });
}

// Funktion, um Adressen vom Benutzer einzufordern
function askForAddress(rl) {
  rl.question("Möchtest du eine Adresse hinzufügen? (y/n): ", (answer) => {
    if (answer.toLowerCase() === "y") {
      rl.question("Gib die URL ein, die du scrapen möchtest: ", (address) => {
        Adresses.push(address);
        askForAddress(rl); // Erneut nach einer Adresse fragen
      });
    } else {
      rl.close();
      if (Adresses.length > 0) {
        saveAddresses(); // Speichere die Adressen
        // Scrape alle URLs und speichere am Ende alle Daten in die JSON-Datei
        Promise.all(Adresses.map((adress) => scrapeData(adress))).then(() => {
          console.log("Alle Seiten Fertig!");
          saveToJSON(); // Speichere die gesammelten Daten nach dem Scraping aller URLs
        });
      } else {
        console.log("Keine Adressen zum Scrapen angegeben.");
      }
    }
  });
}

// Funktion, um zu prüfen, ob die JSON-Dateien existieren und Daten enthalten
function checkExistingData() {
  const filePath = path.join(__dirname, "addressList.json");

  fs.readFile(filePath, "utf8", (err, fileData) => {
    if (err) {
      if (err.code === "ENOENT") {
        console.log(
          "Die Adresse-Datei existiert nicht. Du kannst neue Adressen hinzufügen."
        );
        startAddressCollection();
      } else {
        console.error("Fehler beim Lesen der Datei:", err);
      }
    } else if (fileData) {
      try {
        const jsonData = JSON.parse(fileData);
        if (jsonData.length > 0) {
          console.log(
            `Es gibt bereits ${jsonData.length} gespeicherte Adressen.`
          );
          Adresses = jsonData; // Lade die Adressen in den Adresses-Array
        } else {
          console.log("Die Datei existiert, enthält aber keine Adressen.");
        }
        startAddressCollection();
      } catch (err) {
        console.error("Fehler beim Parsen der JSON-Datei:", err);
        startAddressCollection();
      }
    } else {
      console.log("Die Datei ist leer.");
      startAddressCollection();
    }
  });
}

// Funktion, um die Eingabeaufforderung zu starten
function startAddressCollection() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  askForAddress(rl);
}

// Starte das Skript mit Überprüfung der JSON-Dateien
checkExistingData();
