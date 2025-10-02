#!/usr/bin/env node

/**
 * Entity Configuration Diagnostic Tool
 * 
 * Checks entity configurations for common issues:
 * - respondToAI settings
 * - Proximity configuration
 * - Position tracking
 */

// Use native fetch (Node 18+)

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function diagnoseEntities() {
  console.log('='.repeat(80));
  console.log('ENTITY CONFIGURATION DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Fetch entities
    const response = await fetch(`${SERVER_URL}/api/entities`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const entities = await response.json();
    
    if (entities.length === 0) {
      console.log('⚠️  No entities found!');
      return;
    }

    console.log(`Found ${entities.length} entities:\n`);

    // Check each entity
    for (const entity of entities) {
      console.log('━'.repeat(80));
      console.log(`📋 Entity: ${entity.name} (${entity.type})`);
      console.log('━'.repeat(80));
      
      // Check enabled status
      console.log(`\n🔌 Status:`);
      console.log(`   Entity Enabled: ${entity.enabled ? '✅' : '❌'}`);
      console.log(`   LLM Enabled: ${entity.llm?.enabled ? '✅' : '❌'}`);
      
      // Check AI-to-AI communication
      console.log(`\n💬 AI-to-AI Communication:`);
      const respondToAI = entity.knowledge?.chatFilters?.respondToAI ?? false;
      const respondToPlayers = entity.knowledge?.chatFilters?.respondToPlayers ?? true;
      console.log(`   Respond to AI: ${respondToAI ? '✅ YES' : '❌ NO (will ignore AI messages!)'}`);
      console.log(`   Respond to Players: ${respondToPlayers ? '✅ YES' : '❌ NO'}`);
      
      // Check proximity
      console.log(`\n📏 Proximity Configuration:`);
      const proximityRequired = entity.knowledge?.proximityRequired ?? false;
      const maxProximity = entity.knowledge?.maxProximity ?? 10;
      const hasEntityTag = !!entity.appearance?.entityTag;
      const hasPosition = !!entity.appearance?.position;
      
      console.log(`   Proximity Required: ${proximityRequired ? '✅ YES' : '❌ NO'}`);
      
      if (proximityRequired) {
        console.log(`   Max Proximity: ${maxProximity} blocks`);
        console.log(`   Has Entity Tag: ${hasEntityTag ? '✅' : '❌ (position tracking will fail!)'}`);
        console.log(`   Has Position: ${hasPosition ? '✅' : '❌ (not spawned yet?)'}`);
        
        if (hasEntityTag) {
          console.log(`   Entity Tag: "${entity.appearance.entityTag}"`);
        }
        
        if (hasPosition) {
          const pos = entity.appearance.position;
          console.log(`   Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);
        }
        
        // Check for issues
        if (proximityRequired && !hasEntityTag) {
          console.log(`   ⚠️  WARNING: Proximity required but no entityTag!`);
          console.log(`       → This entity will be DENIED all responses (no position to check)`);
        }
      }
      
      // Check model
      console.log(`\n🤖 LLM Configuration:`);
      console.log(`   Model: ${entity.llm?.model || 'not set'}`);
      console.log(`   Temperature: ${entity.llm?.temperature ?? 'not set'}`);
      
      console.log('');
    }

    // Summary and recommendations
    console.log('='.repeat(80));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(80));
    console.log('');

    // Check for AI-to-AI issues
    const aiEntities = entities.filter(e => e.name && e.enabled);
    const withRespondToAI = aiEntities.filter(e => e.knowledge?.chatFilters?.respondToAI);
    
    if (aiEntities.length > 1 && withRespondToAI.length === 0) {
      console.log('🔴 ISSUE: Multiple entities but NONE have respondToAI enabled!');
      console.log('   → AI entities cannot talk to each other');
      console.log('   → Fix: Enable "Respond to AI" in Entity Config sidebar\n');
    } else if (aiEntities.length > 1 && withRespondToAI.length < aiEntities.length) {
      console.log('🟡 WARNING: Some entities cannot hear AI messages:');
      const cannotHear = aiEntities.filter(e => !e.knowledge?.chatFilters?.respondToAI);
      cannotHear.forEach(e => {
        console.log(`   - ${e.name} (respondToAI: false)`);
      });
      console.log('');
    }

    // Check for proximity issues
    const proximityEntities = entities.filter(e => e.knowledge?.proximityRequired);
    const proximityWithoutTag = proximityEntities.filter(e => !e.appearance?.entityTag);
    
    if (proximityWithoutTag.length > 0) {
      console.log('🔴 ISSUE: Entities with proximity but no entityTag (will be denied all responses):');
      proximityWithoutTag.forEach(e => {
        console.log(`   - ${e.name}`);
      });
      console.log('   → Fix: Re-spawn these entities with the latest MobSpawner\n');
    }

    // Check for proximity without position
    const proximityWithoutPosition = proximityEntities.filter(e => e.appearance?.entityTag && !e.appearance?.position);
    if (proximityWithoutPosition.length > 0) {
      console.log('🟡 WARNING: Entities with proximity but no position (not spawned yet?):');
      proximityWithoutPosition.forEach(e => {
        console.log(`   - ${e.name} (tag: ${e.appearance.entityTag})`);
      });
      console.log('   → They will be denied responses until position tracker finds them\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nIs the server running? Check: http://localhost:3000/api/entities');
  }
}

diagnoseEntities();

