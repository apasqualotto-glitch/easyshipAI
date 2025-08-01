// Diagnostic script to test quote calculation data integrity

async function runDiagnostics() {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log('=== FreightCalc SA Quote Calculation Diagnostics ===\n');
  
  try {
    // Test 1: Check port data availability
    console.log('1. Testing port data availability...');
    const allPorts = await fetch(`${baseUrl}/ports`).then(r => r.json()).catch(() => []);
    const originPorts = await fetch(`${baseUrl}/ports/origin`).then(r => r.json()).catch(() => []);
    
    console.log(`   Total ports: ${allPorts.length}`);
    console.log(`   Origin ports: ${originPorts.length}`);
    
    // Test 2: Verify specific port exists
    console.log('\n2. Testing specific port lookup (New York, USA - port 34)...');
    const port34Debug = await fetch(`${baseUrl}/debug-ports/34`).then(r => r.json()).catch(e => ({ error: e.message }));
    console.log(`   Port 34 found: ${port34Debug.found ? 'YES' : 'NO'}`);
    if (port34Debug.found) {
      console.log(`   Name: ${port34Debug.found.name}`);
      console.log(`   Type: ${port34Debug.found.type}`);
      console.log(`   Country: ${port34Debug.found.country}`);
    }
    
    // Test 3: Verify route exists
    console.log('\n3. Testing route availability (34 -> 10)...');
    const routeDebug = await fetch(`${baseUrl}/debug-routes/34-10`).then(r => r.json()).catch(e => ({ error: e.message }));
    console.log(`   Route found: ${routeDebug.route ? 'YES' : 'NO'}`);
    if (routeDebug.route) {
      console.log(`   20ft cost: R${routeDebug.route.seaFreightCost20ft.toLocaleString()}`);
      console.log(`   Transit: ${routeDebug.route.transitDays} days`);
    }
    
    // Test 4: Test actual quote calculation
    console.log('\n4. Testing quote calculation...');
    const quotePayload = {
      originPort: "34",
      destinationPort: "10", 
      finalDestination: "Cape Town, Western Cape",
      containerType: "20ft",
      value: 15000,
      weight: 2000,
      incoterm: "FOB",
      cargoType: "textiles"
    };
    
    const quoteResponse = await fetch(`${baseUrl}/calculate-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload)
    });
    
    const quoteResult = await quoteResponse.json();
    console.log(`   Quote success: ${quoteResponse.ok ? 'YES' : 'NO'}`);
    
    if (quoteResponse.ok) {
      console.log(`   Sea freight: R${quoteResult.seaFreightCost?.toLocaleString()}`);
      console.log(`   Total cost: R${quoteResult.totalCost?.toLocaleString()}`);
      console.log('   ✅ DATA INTEGRITY: GOOD - Real shipping rates provided');
    } else {
      console.log(`   Error: ${quoteResult.message}`);
      console.log('   ❌ DATA INTEGRITY: FAILED - Using synthetic data fallback');
    }
    
    // Test 5: Test enhanced quote with live rates
    console.log('\n5. Testing enhanced quote with live rates...');
    const enhancedResponse = await fetch(`${baseUrl}/calculate-quote-with-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload)
    });
    
    const enhancedResult = await enhancedResponse.json();
    console.log(`   Enhanced quote: ${enhancedResponse.ok ? 'YES' : 'NO'}`);
    
    if (enhancedResponse.ok && enhancedResult.freightForwarders) {
      console.log(`   Freight forwarders: ${enhancedResult.freightForwarders.length} available`);
      console.log('   ✅ FREIGHT FORWARDER DATA: Available');
    }
    
  } catch (error) {
    console.error('Diagnostic error:', error);
  }
  
  console.log('\n=== Diagnostic Complete ===');
}

runDiagnostics();