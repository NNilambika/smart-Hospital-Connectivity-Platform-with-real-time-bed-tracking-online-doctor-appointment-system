// FORCE SET HOSPITAL NAME (Replace with your actual hospital)
localStorage.setItem('hospitalName', 'Your Hospital Name Here');
localStorage.setItem('staffName', 'Your Hospital Name Here');
// 📁 script.js - Complete working version with stats update
import { db, auth } from "./firebase.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let allHospitals = [];
let currentFilter = 'all';

// ====================================
// LOAD HOSPITALS FROM FIREBASE (with real-time updates)
// ====================================
function loadHospitals() {
  console.log("Loading hospitals...");
  const hospitalList = document.getElementById("hospitalList");
  if (!hospitalList) {
    console.error("Hospital list element not found");
    return;
  }
  
  hospitalList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading hospitals...</div>';
  
  // Set up real-time listener
  const q = query(collection(db, "hospitals"), where("status", "==", "approved"));
  
  onSnapshot(q, (querySnapshot) => {
    console.log(`Found ${querySnapshot.size} hospitals`);
    
    if (querySnapshot.empty) {
      hospitalList.innerHTML = '<p class="no-results">No hospitals registered yet. Click "Register Your Hospital" to add one.</p>';
      updateAllStats(0, 0, 0, 0);
      return;
    }
    
    allHospitals = [];
    let totalBeds = 0;
    let totalAmbulances = 0;
    let totalGeneralBeds = 0;
    let totalIcuBeds = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Hospital data:", data);
      
      const generalBeds = Number(data.general_available) || 0;
      const icuBeds = Number(data.icu_available) || 0;
      const ambulanceCount = Number(data.ambulance_count) || 1;
      
      const hospital = {
        id: doc.id,
        name: data.name || 'Unknown Hospital',
        city: data.city || 'City',
        general_available: generalBeds,
        icu_available: icuBeds,
        ambulance_count: ambulanceCount,
        ambulance_number: data.ambulance_number || '108',
        phone: data.phone || 'Contact hospital',
        emergency_247: data.emergency_247 || false,
        status: data.status || 'approved'
      };
      
      allHospitals.push(hospital);
      
      // Calculate totals
      totalGeneralBeds += generalBeds;
      totalIcuBeds += icuBeds;
      totalBeds += generalBeds + icuBeds;
      totalAmbulances += ambulanceCount;
    });
    
    console.log(`Loaded ${allHospitals.length} hospitals`);
    console.log(`Stats - Hospitals: ${allHospitals.length}, Total Beds: ${totalBeds}, General: ${totalGeneralBeds}, ICU: ${totalIcuBeds}, Ambulances: ${totalAmbulances}`);
    
    // Update ALL stats
    updateAllStats(allHospitals.length, totalBeds, totalAmbulances, totalGeneralBeds, totalIcuBeds);
    
    // Display hospitals
    displayHospitals(allHospitals);
    
  }, (error) => {
    console.error("Error loading hospitals:", error);
    hospitalList.innerHTML = '<p class="no-results">Error loading hospitals. Please refresh.</p>';
  });
}

// ====================================
// UPDATE ALL STATS
// ====================================
function updateAllStats(hospitalCount, totalBeds, totalAmbulances, totalGeneralBeds, totalIcuBeds) {
  console.log(`Updating stats - Hospitals: ${hospitalCount}, Beds: ${totalBeds}, Ambulances: ${totalAmbulances}`);
  
  // Update all stat elements with multiple selector strategies
  const elements = {
    // Hero section stats
    totalHospitalsCount: document.getElementById('totalHospitalsCount'),
    availableBedsCount: document.getElementById('availableBedsCount'),
    ambulanceCount: document.getElementById('ambulanceCount'),
    
    // Stats bar
    totalAvailable: document.getElementById('totalAvailable'),
    totalAmbulances: document.getElementById('totalAmbulances'),
    
    // Results count
    showingCount: document.getElementById('showingCount'),
    hospitalCount: document.getElementById('hospitalCount')
  };
  
  // Update each element if it exists
  if (elements.totalHospitalsCount) {
    elements.totalHospitalsCount.textContent = hospitalCount;
    console.log('Updated totalHospitalsCount:', hospitalCount);
  }
  
  if (elements.availableBedsCount) {
    elements.availableBedsCount.textContent = totalBeds;
    console.log('Updated availableBedsCount:', totalBeds);
  }
  
  if (elements.ambulanceCount) {
    elements.ambulanceCount.textContent = totalAmbulances;
    console.log('Updated ambulanceCount:', totalAmbulances);
  }
  
  if (elements.totalAvailable) {
    elements.totalAvailable.textContent = totalBeds;
    console.log('Updated totalAvailable:', totalBeds);
  }
  
  if (elements.totalAmbulances) {
    elements.totalAmbulances.textContent = totalAmbulances;
    console.log('Updated totalAmbulances:', totalAmbulances);
  }
  
  if (elements.showingCount) {
    elements.showingCount.textContent = hospitalCount;
    console.log('Updated showingCount:', hospitalCount);
  }
  
  if (elements.hospitalCount) {
    elements.hospitalCount.innerHTML = `<span>${hospitalCount}</span> hospitals found`;
    console.log('Updated hospitalCount:', hospitalCount);
  }
  
  // Also try to update by tag name for any missed elements
  const allSpans = document.querySelectorAll('span');
  allSpans.forEach(span => {
    if (span.textContent.includes('0 Hospitals') || span.textContent.includes('Hospitals') && span.textContent.includes('0')) {
      span.textContent = span.textContent.replace('0', hospitalCount);
    }
    if (span.textContent.includes('0 Available Beds') || span.textContent.includes('Available Beds') && span.textContent.includes('0')) {
      span.textContent = span.textContent.replace('0', totalBeds);
    }
    if (span.textContent.includes('0 Ambulances') || span.textContent.includes('Ambulances') && span.textContent.includes('0')) {
      span.textContent = span.textContent.replace('0', totalAmbulances);
    }
  });
}

// ====================================
// DISPLAY HOSPITALS
// ====================================
function displayHospitals(hospitals) {
  const hospitalList = document.getElementById("hospitalList");
  
  if (!hospitalList) return;
  
  if (hospitals.length === 0) {
    hospitalList.innerHTML = '<p class="no-results">No hospitals found matching your criteria</p>';
    return;
  }
  
  hospitalList.innerHTML = "";
  
  hospitals.forEach(hospital => {
    const generalStatus = getBedStatus(hospital.general_available);
    const icuStatus = getBedStatus(hospital.icu_available);
    
    const card = document.createElement("div");
    card.className = "hospital-card";
    card.innerHTML = `
      <div class="hospital-header">
        <h3>🏥 ${hospital.name}</h3>
        <span class="hospital-distance">📍 ${hospital.city}</span>
      </div>
      
      <div class="bed-stats">
        <div class="bed-stat">
          <span class="label">General Ward</span>
          <span class="number ${generalStatus}">${hospital.general_available}</span>
        </div>
        <div class="bed-stat">
          <span class="label">ICU</span>
          <span class="number ${icuStatus}">${hospital.icu_available}</span>
        </div>
      </div>
      
      <div class="ambulance-info-card">
        <div>
          <i class="fas fa-ambulance"></i>
          <span class="ambulance-number">${hospital.ambulance_number}</span>
          <span> (${hospital.ambulance_count} ambulances)</span>
        </div>
        <button class="ambulance-call-btn" onclick="callAmbulance('${hospital.ambulance_number}')">
          <i class="fas fa-phone"></i> Call
        </button>
      </div>
      
      <div class="hospital-footer">
        <button class="view-details-btn" onclick="selectHospital('${hospital.id}', '${hospital.name}')">
          View Details →
        </button>
        <span><i class="fas fa-phone-alt"></i> ${hospital.phone}</span>
      </div>
    `;
    hospitalList.appendChild(card);
  });
  
  updateShowingCount(hospitals.length);
}

// ====================================
// REGISTER HOSPITAL (WITH FIREBASE)
// ====================================
window.registerHospital = async function() {
  try {
    console.log("Starting hospital registration...");
    
    // Get all form values
    const hospitalName = document.getElementById('hospitalName')?.value;
    const hospitalCity = document.getElementById('hospitalCity')?.value;
    const hospitalState = document.getElementById('hospitalState')?.value;
    const hospitalAddress = document.getElementById('hospitalAddress')?.value;
    const hospitalPhone = document.getElementById('hospitalPhone')?.value;
    const hospitalMobile = document.getElementById('hospitalMobile')?.value;
    const hospitalEmail = document.getElementById('hospitalEmail')?.value;
    const generalBeds = parseInt(document.getElementById('generalBeds')?.value) || 0;
    const icuBeds = parseInt(document.getElementById('icuBeds')?.value) || 0;
    const ambulanceCount = parseInt(document.getElementById('ambulanceCount')?.value) || 1;
    const ambulancePhone = document.getElementById('ambulancePhone')?.value;
    const emergency247 = document.getElementById('emergency247')?.value;
    const adminEmail = document.getElementById('adminEmail')?.value;
    const password = document.getElementById('adminPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const terms = document.getElementById('terms')?.checked;
    
    // Validation
    if (!hospitalName || !hospitalCity || !hospitalState || !hospitalAddress) {
      alert('Please fill all hospital information fields');
      return;
    }
    
    if (!hospitalPhone || !hospitalEmail) {
      alert('Please fill contact information');
      return;
    }
    
    if (!adminEmail || !password) {
      alert('Please enter admin email and password');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    if (!terms) {
      alert('Please accept the terms');
      return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('.register-submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
      submitBtn.disabled = true;
    }
    
    // Create hospital document in Firestore
    const hospitalData = {
      name: hospitalName,
      city: hospitalCity,
      state: hospitalState,
      address: hospitalAddress,
      phone: hospitalPhone,
      mobile: hospitalMobile || '',
      email: hospitalEmail,
      general_available: generalBeds,
      icu_available: icuBeds,
      ambulance_count: ambulanceCount,
      ambulance_number: ambulancePhone || "108",
      ambulance_available: true,
      emergency_247: emergency247 === 'yes',
      status: "approved",
      registeredDate: new Date().toISOString(),
      createdBy: adminEmail
    };
    
    console.log("Saving hospital:", hospitalData);
    
    // Save to Firestore
    const docRef = await addDoc(collection(db, "hospitals"), hospitalData);
    console.log("Hospital registered with ID: ", docRef.id);
    
    // Create user in Firebase Authentication
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, password);
      console.log("Admin user created:", userCredential.user.uid);
    } catch (authError) {
      console.warn("Auth user creation failed (maybe already exists):", authError);
      // Continue even if auth fails - hospital still saved
    }
    
    // Show success
    document.getElementById('successHospitalName').textContent = hospitalName;
    document.getElementById('successAdminEmail').textContent = adminEmail;
    
    // Close registration modal
    closeRegisterModal();
    
    // Show success modal
    document.getElementById('successModal').style.display = 'block';
    
    // Reset form
    document.getElementById('hospitalRegisterForm').reset();
    
    console.log("Hospital registered successfully!");
    
  } catch (error) {
    console.error("Error registering hospital:", error);
    alert("Registration failed: " + error.message);
  } finally {
    // Reset button
    const submitBtn = document.querySelector('.register-submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Register Hospital';
      submitBtn.disabled = false;
    }
  }
};

// ====================================
// CLOSE SUCCESS MODAL
// ====================================
window.closeSuccessModal = function() {
  document.getElementById('successModal').style.display = 'none';
  document.body.style.overflow = 'auto';
};

// ====================================
// HELPER FUNCTIONS
// ====================================
function getBedStatus(count) {
  if (count === 0) return 'red';
  if (count < 5) return 'orange';
  return 'green';
}

function updateShowingCount(count) {
  const showingEl = document.getElementById('showingCount');
  if (showingEl) showingEl.textContent = count;
  
  const hospitalCount = document.getElementById('hospitalCount');
  if (hospitalCount) {
    hospitalCount.innerHTML = `<span>${count}</span> hospitals found`;
  }
}

// ====================================
// SEARCH AND FILTER FUNCTIONS
// ====================================
window.searchHospitals = function() {
  const searchTerm = document.getElementById("searchHospital")?.value.toLowerCase() || '';
  console.log("Searching for:", searchTerm);
  
  if (!allHospitals.length) return;
  
  if (searchTerm === '') {
    displayHospitals(allHospitals);
    updateShowingCount(allHospitals.length);
    return;
  }
  
  const filtered = allHospitals.filter(hospital => 
    hospital.name.toLowerCase().includes(searchTerm) ||
    (hospital.city && hospital.city.toLowerCase().includes(searchTerm))
  );
  
  console.log(`Found ${filtered.length} hospitals matching "${searchTerm}"`);
  displayHospitals(filtered);
  updateShowingCount(filtered.length);
};

window.filterHospitals = function(filter) {
  console.log("Filtering by:", filter);
  
  // Update active button
  document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }
  
  currentFilter = filter;
  
  let filtered = [...allHospitals];
  
  if (filter === 'available') {
    filtered = filtered.filter(h => h.general_available > 0 || h.icu_available > 0);
  } else if (filter === 'emergency') {
    filtered = filtered.filter(h => h.emergency_247 === true);
  } else if (filter === 'icu') {
    filtered = filtered.filter(h => h.icu_available > 0);
  } else if (filter === 'nearby') {
    // For demo, sort by city name
    filtered = [...filtered].sort((a, b) => a.city.localeCompare(b.city));
  }
  
  displayHospitals(filtered);
};

// ====================================
// OTHER FUNCTIONS
// ====================================
window.selectHospital = function(hospitalId, hospitalName) {
  localStorage.setItem("selectedHospitalId", hospitalId);
  localStorage.setItem("selectedHospitalName", hospitalName);
  window.location.href = "hospital-select.html";
};

window.callAmbulance = function(number) {
  if (confirm(`🚑 Call ambulance at ${number}?`)) {
    window.location.href = `tel:${number}`;
  }
};

window.loadMoreHospitals = function() {
  alert('All hospitals loaded');
};

// ====================================
// ADD SAMPLE HOSPITALS (for testing)
// ====================================
window.addSampleHospitals = async function() {
  try {
    console.log("Adding sample hospitals...");
    
    const sampleHospitals = [
      {
        name: "City General Hospital",
        city: "Mumbai",
        state: "Maharashtra",
        address: "MG Road, Mumbai",
        phone: "022-12345678",
        email: "contact@citygeneral.com",
        general_available: 45,
        icu_available: 12,
        ambulance_count: 3,
        ambulance_number: "102",
        emergency_247: true,
        status: "approved"
      },
      {
        name: "Apollo Medical Center",
        city: "Bangalore",
        state: "Karnataka",
        address: "Bannerghatta Road, Bangalore",
        phone: "080-23456789",
        email: "contact@apollo.com",
        general_available: 32,
        icu_available: 8,
        ambulance_count: 2,
        ambulance_number: "108",
        emergency_247: true,
        status: "approved"
      },
      {
        name: "Fortis Hospital",
        city: "Delhi",
        state: "Delhi",
        address: "Okhla Road, Delhi",
        phone: "011-34567890",
        email: "contact@fortis.com",
        general_available: 0,
        icu_available: 3,
        ambulance_count: 4,
        ambulance_number: "102",
        emergency_247: true,
        status: "approved"
      },
      {
        name: "Arun Hospital",
        city: "Chennai",
        state: "Tamil Nadu",
        address: "Mount Road, Chennai",
        phone: "044-45678901",
        email: "contact@arunhospital.com",
        general_available: 25,
        icu_available: 6,
        ambulance_count: 2,
        ambulance_number: "108",
        emergency_247: true,
        status: "approved"
      }
    ];
    
    for (let hospital of sampleHospitals) {
      await addDoc(collection(db, "hospitals"), hospital);
      console.log(`Added: ${hospital.name}`);
    }
    
    alert("✅ 4 sample hospitals added! Stats will update automatically.");
    
  } catch (error) {
    console.error("Error adding samples:", error);
    alert("Error adding samples: " + error.message);
  }
};

// ====================================
// DEBUG FUNCTION
// ====================================
window.debugHospitals = function() {
  console.log("=== DEBUG INFO ===");
  console.log("All hospitals array:", allHospitals);
  console.log("Total hospitals:", allHospitals.length);
  
  // Calculate totals for debug
  let totalBeds = 0;
  let totalAmbulances = 0;
  allHospitals.forEach(h => {
    totalBeds += (h.general_available || 0) + (h.icu_available || 0);
    totalAmbulances += h.ambulance_count || 1;
  });
  
  console.log("Total beds:", totalBeds);
  console.log("Total ambulances:", totalAmbulances);
  console.log("Firebase connection:", db ? "Connected" : "Not connected");
  
  // Check DOM elements
  const elements = ['totalHospitalsCount', 'availableBedsCount', 'ambulanceCount', 'totalAvailable', 'totalAmbulances', 'hospitalList'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    console.log(`Element #${id}:`, el ? "Found" : "NOT FOUND");
  });
  
  alert(`Debug info logged to console. Found ${allHospitals.length} hospitals with ${totalBeds} beds and ${totalAmbulances} ambulances.`);
};

// ====================================
// INITIALIZE
// ====================================
// Load hospitals when page loads
if (window.location.pathname.includes('index.html') || 
    window.location.pathname === '/' || 
    window.location.pathname === '') {
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log("DOM loaded, loading hospitals...");
      loadHospitals();
    });
  } else {
    console.log("DOM already loaded, loading hospitals...");
    loadHospitals();
  }
}

// Make functions available globally
window.loadHospitals = loadHospitals;
window.addSampleHospitals = addSampleHospitals;
window.debugHospitals = debugHospitals;
window.filterHospitals = filterHospitals;
window.searchHospitals = searchHospitals;
window.callAmbulance = callAmbulance;
window.selectHospital = selectHospital;
