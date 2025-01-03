document.addEventListener("DOMContentLoaded", () => {
    const inputElement = document.getElementById("infractionInput");
    const autocompleteList = document.getElementById("autocompleteList");
    const infractionTableBody = document.getElementById("infractionTableBody");
    const totalAmountElement = document.getElementById("totalAmount");
  
    let timeoutId;
    let totalAmount = 0;
    const penalties = {};
  
    async function handleAutocomplete() {
      const query = inputElement.value.trim();
      if (!query) {
        autocompleteList.innerHTML = "";
        autocompleteList.classList.remove("visible");
        return;
      }
  
      if (timeoutId) clearTimeout(timeoutId);
  
      timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`http://80.182.152.218:1050/api/autocomplete?q=${query}`);
          const suggestions = await response.json();
  
          autocompleteList.innerHTML = "";
          if (suggestions.length > 0) {
            suggestions.forEach((item) => {
              const suggestionElement = document.createElement("div");
              suggestionElement.textContent = `${item.infrazione} (${item.codice})`;
              suggestionElement.className = "autocomplete-item";
              suggestionElement.onclick = () => {
                inputElement.value = item.infrazione;
                autocompleteList.innerHTML = "";
                autocompleteList.classList.remove("visible");
  
                
                if (penalties[item.codice]) {
                  alert("Infrazione già presente!");
                  return;
                }
  
                addInfraction(item);
              };
              autocompleteList.appendChild(suggestionElement);
            });
            autocompleteList.classList.add("visible");
          } else {
            autocompleteList.classList.remove("visible");
          }
        } catch (error) {
          console.error("Errore nell'autocomplete:", error);
        }
      }, 300);
    }

    function copyInfractionsToClipboard() {
      const rows = infractionTableBody.querySelectorAll("tr");
      let infractionNames = [];
    
      rows.forEach(row => {
        const columns = row.querySelectorAll("td");
        const infrazione = columns[1].textContent.trim();
    
        const infrazioneNoEmojis = infrazione.replace(/[^\w\s]/g, '').trim();
        infractionNames.push(infrazioneNoEmojis);
      });
    
      const infractionText = infractionNames.join(", ");
    
      navigator.clipboard.writeText(infractionText).then(() => {
        alert("Infrazioni copiate nella clipboard!");
      }).catch(err => {
        console.error("Errore nel copiare le infrazioni:", err);
      });
    }
    
  
    function addInfraction(item) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.codice}</td>
        <td>${item.infrazione}</td>
        <td>€${item.multa}</td>
        <td>€${item.massimo}</td>
        <td><button class="remove">Rimuovi</button></td>
        <td>
          <div class="slider-container">
            <input
              type="number"
              class="manual-penalty"
              min="${item.multa}"
              max="${item.massimo}"
              value="${item.multa}"
              data-id="${item.codice}"
            />
            <input
              type="range"
              class="slider"
              min="${item.multa}"
              max="${item.massimo}"
              value="${item.multa}"
              data-id="${item.codice}"
            />
            <span>Min: €${item.multa} / Max: €${item.massimo}</span>
          </div>
        </td>
      `;
      infractionTableBody.appendChild(row);
      penalties[item.codice] = item.multa;
      updateTotal(item.multa);
      inputElement.value = "";
  
      const slider = row.querySelector(".slider");
      const manualInput = row.querySelector(".manual-penalty");
  
      slider.addEventListener("input", (event) => {
        const value = parseFloat(event.target.value);
        manualInput.value = value;
        updatePenalty(value, event.target.dataset.id);
      });

      copyButton.addEventListener("click", copyInfractionsToClipboard);
  
      manualInput.addEventListener("input", (event) => {
        const value = parseFloat(event.target.value);
        slider.value = value;
        updatePenalty(value, event.target.dataset.id);
      });
  
      const removeButton = row.querySelector(".remove");
      removeButton.addEventListener("click", () => removeInfraction(row, item.codice));
    }
  
    function removeInfraction(row, codice) {
      const penalty = penalties[codice];
      totalAmount -= penalty;
      delete penalties[codice];
      totalAmountElement.textContent = formatCurrency(totalAmount);
      row.remove();
    }
  
    function updatePenalty(value, codice) {
      const previousValue = penalties[codice];
      totalAmount -= previousValue;
      penalties[codice] = value;
      totalAmount += value;
      totalAmountElement.textContent = formatCurrency(totalAmount);
    }
  
    function updateTotal(value) {
      totalAmount += value;
      totalAmountElement.textContent = formatCurrency(totalAmount);
    }
  
    function formatCurrency(amount) {
      return `€${amount.toFixed(0)}`;
    }
  
    inputElement.addEventListener("input", handleAutocomplete);
  });
  