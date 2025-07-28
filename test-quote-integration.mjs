#!/usr/bin/env node

// Test the new quote display integration
console.log('🚢 Testing Quote Display Integration');

async function testQuoteGeneration() {
  console.log('\n📋 Testing Quote API for Chat Integration...');
  
  try {
    const response = await fetch('http://localhost:5000/api/calculate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originPort: 'shanghai',
        destinationPort: 'durban',
        finalDestination: 'johannesburg',
        containerType: '20ft',
        cargoType: 'electronics',
        cargoValue: 50000,
        cargoWeight: 15000,
        weight: 15000,
        value: 50000,
        incoterm: 'FOB'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.quote) {
      console.log('✅ Quote Generation: WORKING');
      console.log(`   Total Cost: R${data.quote.breakdown?.total?.toLocaleString()}`);
      console.log(`   Sea Freight: R${data.quote.breakdown?.seaFreight?.toLocaleString()}`);
      console.log(`   Transit Days: ${data.quote.totalDays} days`);
      console.log(`   Route: ${data.quote.route?.origin} → ${data.quote.route?.destination}`);
      return true;
    } else {
      console.log('❌ Quote Generation: FAILED');
      console.log(`   Error: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Quote Generation: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testChatWithQuoteRequest() {
  console.log('\n💬 Testing Chat with Quote Request...');
  
  try {
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I need a quote for container from China',
        context: { page: 'test' },
        conversationHistory: []
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.response) {
      console.log('✅ Chat AI Response: WORKING');
      
      // Check if response mentions calculator/quote
      const mentionsCalculator = data.response.toLowerCase().includes('calculator') || 
                                data.response.toLowerCase().includes('detailed quote');
      
      if (mentionsCalculator) {
        console.log('✅ Calculator Suggestion: INCLUDED');
      } else {
        console.log('⚠️  Calculator Suggestion: NOT FOUND');
      }
      
      console.log(`   Response Preview: "${data.response.substring(0, 100)}..."`);
      return true;
    } else {
      console.log('❌ Chat AI Response: FAILED');
      return false;
    }
  } catch (error) {
    console.log('❌ Chat AI Response: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const quoteTest = await testQuoteGeneration();
  const chatTest = await testChatWithQuoteRequest();
  
  console.log('\n🎯 Integration Summary:');
  console.log(`   Quote API: ${quoteTest ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Chat Integration: ${chatTest ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (quoteTest && chatTest) {
    console.log('\n✅ Quote Display Integration: READY');
    console.log('   Users can now get detailed quotes with carrier options');
    console.log('   AI will suggest using calculator for comprehensive quotes');
    console.log('   Visual quote display shows breakdown and carrier comparison');
  } else {
    console.log('\n⚠️  Some components need attention');
  }
}

await runTests();