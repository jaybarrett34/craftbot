# Model Management Guide

**Date:** October 1, 2025  
**Purpose:** How to manage Ollama models and fix entity model mismatches

---

## Common Issue: Model Not Available

### Symptom
```
Error: Model "llama2" is not pulled
Entity "Satan" fails to respond
```

### Root Cause
- Entity was created with a default model (e.g., "llama2")
- That model isn't actually installed on your system
- Entity tries to use unavailable model and fails

---

## Solution 1: Pull the Required Model

If you want to use the model the entity is configured for:

```bash
# Check what models you have
ollama list

# Pull the missing model
ollama pull llama2

# Or pull a specific variant
ollama pull llama2:7b
```

**Available Models:**
- `llama2` or `llama2:7b` - ~3.8 GB, general purpose
- `llama3.2` - Latest Llama model
- `mistral` - ~4.1 GB, good performance
- `qwen2.5:14b-instruct` - ~8.4 GB, excellent quality (recommended)
- `phi` - ~1.6 GB, small and fast
- `codellama` - Specialized for code

See full list: https://ollama.com/library

---

## Solution 2: Change Entity's Model

### Via Entity Config Sidebar

1. Open the frontend (http://localhost:5173)
2. Click on the entity in the left sidebar
3. Scroll to "LLM Configuration"
4. If you see a ⚠️ warning, the model isn't available
5. Select a different model from the dropdown
6. Changes save automatically

### Via JSON Editor

1. Click "Raw JSON" toggle in Entity Config
2. Find the entity's LLM section:
```json
"llm": {
  "model": "llama2",  // ← Change this
  "temperature": 0.7,
  "enabled": true
}
```
3. Change to an available model
4. Changes save automatically

---

## Solution 3: Update Default Models

### Update System-Wide Defaults

Edit `.env` file:
```bash
OLLAMA_MODEL=qwen2.5:14b-instruct  # Change default model
```

This only affects:
- New console entities
- Backend default if no model specified

**Does NOT affect existing entities** - they keep their configured model.

### Update Frontend Defaults

The frontend now automatically:
1. Fetches available models from Ollama
2. Uses first available model as default
3. Prefers `qwen2.5` if available
4. Falls back gracefully if no models found

**No manual changes needed!**

---

## Model Selection Strategy

### By Use Case

**For Simple NPCs (Fast Response):**
- `llama2:7b` - 3.8 GB, quick
- `phi` - 1.6 GB, very fast
- `mistral:7b` - 4.1 GB, balanced

**For Complex NPCs (Quality):**
- `qwen2.5:14b-instruct` - 8.4 GB, best quality ✅ Recommended
- `llama3.2` - Latest features
- `mixtral` - Very capable, larger

**For Server/Console (Full Power):**
- `qwen2.5:14b-instruct` - Excellent reasoning
- `mixtral:8x7b` - Best quality (45 GB!)
- `llama3.2:70b` - Latest, powerful

### By Hardware

**4 GB RAM:**
- Maximum: `phi` (1.6 GB)
- Avoid models > 7B parameters

**8 GB RAM:**
- Comfortable: `llama2:7b`, `mistral:7b`
- Possible: `qwen2.5:14b` (tight)

**16 GB RAM:**
- Comfortable: `qwen2.5:14b-instruct`
- Possible: `mixtral:8x7b`

**32+ GB RAM:**
- Any model works
- Can run multiple simultaneously

---

## Bulk Update All Entities

### Update All Entities to Same Model

1. Open Entity Config
2. Toggle "Raw JSON" mode
3. Use Find & Replace:
   - Find: `"model": "llama2"`
   - Replace: `"model": "qwen2.5:14b-instruct"`
4. Click outside textarea to save

### Script Method

Create a script to update all at once:

```javascript
// In browser console on frontend
const newModel = 'qwen2.5:14b-instruct';

// Get all entities
fetch('http://localhost:3000/api/entities')
  .then(r => r.json())
  .then(entities => {
    entities.forEach(entity => {
      if (entity.llm && entity.llm.model) {
        entity.llm.model = newModel;
        // Update entity
        fetch(`http://localhost:3000/api/entities/${entity.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entity)
        });
      }
    });
    console.log(`Updated ${entities.length} entities to ${newModel}`);
  });
```

---

## Model Diagnostics

### Check Available Models

Use the **Model Diagnostics** component in the frontend:
- Located below Mob Spawner
- Shows all installed models
- Displays model size and details
- Has refresh button
- Provides install commands

### Verify Model Works

```bash
# Test model directly
ollama run qwen2.5:14b-instruct "Hello, respond briefly"

# Should get a response
# If not, model isn't working
```

### Common Model Issues

**Issue:** Model exists but errors on use
```bash
# Solution: Reinstall model
ollama rm qwen2.5:14b-instruct
ollama pull qwen2.5:14b-instruct
```

**Issue:** Model runs out of memory
```bash
# Solution: Use smaller variant
ollama pull qwen2.5:7b-instruct  # Smaller version
```

**Issue:** Model is slow
```bash
# Solution: Use GPU acceleration
# Make sure Ollama is using your GPU
ollama ps  # Shows running models and resource usage
```

---

## Model Configuration Per Entity

Each entity can have its own model! This is useful for:

### Specialization
```javascript
{
  name: "Librarian",
  llm: { model: "llama2:13b", ... }  // Better for conversations
}
{
  name: "Guard",
  llm: { model: "phi", ... }  // Fast responses, simple behavior
}
```

### Resource Management
```javascript
{
  name: "Server Console",
  llm: { model: "qwen2.5:14b-instruct", ... }  // Best quality
}
{
  name: "Village Idiot",
  llm: { model: "phi", ... }  // Intentionally simple
}
```

### Testing
```javascript
{
  name: "Test NPC A",
  llm: { model: "llama2:7b", ... }
}
{
  name: "Test NPC B",
  llm: { model: "qwen2.5:14b-instruct", ... }
}
// Compare responses side-by-side
```

---

## Recommended Setup

### For Best Experience

1. **Pull qwen2.5:14b-instruct** (recommended default)
   ```bash
   ollama pull qwen2.5:14b-instruct
   ```

2. **Pull one small model** for simple NPCs
   ```bash
   ollama pull phi  # or mistral:7b
   ```

3. **Set system default** in `.env`
   ```
   OLLAMA_MODEL=qwen2.5:14b-instruct
   ```

4. **Update console entity** to use qwen2.5
   - Via Entity Config sidebar
   - Select "Server Console"
   - Change model to qwen2.5:14b-instruct

5. **Spawn new NPCs** with model selector
   - Model dropdown shows available models
   - Defaults to qwen2.5 if available
   - Or select different model per NPC

---

## Migration Path

### If You Have Old Entities with llama2

**Option A: Keep llama2**
```bash
ollama pull llama2:7b
# All entities continue working
```

**Option B: Migrate to qwen2.5**
```bash
# 1. Pull new model
ollama pull qwen2.5:14b-instruct

# 2. Update each entity via UI
#    (or use bulk update script above)

# 3. Optional: Remove old model
ollama rm llama2
```

**Option C: Mixed Approach**
```bash
# Keep both models
ollama pull llama2:7b
ollama pull qwen2.5:14b-instruct

# Use qwen for important NPCs
# Use llama2 for simple ones
```

---

## Troubleshooting

### Entity Still Fails After Model Change

1. **Verify model is actually available**
   ```bash
   ollama list | grep qwen
   ```

2. **Check entity config saved**
   - Open Entity Config
   - Toggle Raw JSON
   - Verify `"model": "qwen2.5:14b-instruct"`

3. **Restart MCP server**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run start
   ```

4. **Check server logs**
   ```
   [MCPServer] Sending to Ollama (model: qwen2.5:14b-instruct)...
   ```
   Should show correct model name

### Model Dropdown Shows "No models available"

1. **Check Ollama is running**
   ```bash
   ollama list
   # Should show your models
   ```

2. **Check Ollama is accessible**
   ```bash
   curl http://localhost:11434/api/tags
   # Should return JSON with models
   ```

3. **Restart frontend**
   ```bash
   # In frontend terminal
   # Ctrl+C, then
   npm run dev
   ```

4. **Use Model Diagnostics component**
   - Click Refresh button
   - Should fetch models from server

### Model Changed But Old Model Still Used

This means the entity config didn't save. Try:

1. **Use handleNestedFieldChange explicitly**
   - Select different model in dropdown
   - Wait 1 second
   - Check Raw JSON to verify

2. **Manual JSON edit**
   - Toggle to Raw JSON
   - Edit `"model": "..."` directly
   - Click outside textarea
   - Toggle back to Pretty view

3. **Re-create entity**
   - Delete problematic entity
   - Create new one
   - New model will be used

---

## Best Practices

1. **✅ Pull models before creating entities**
   - Check available models first
   - Pull what you need
   - Then spawn NPCs

2. **✅ Use Model Diagnostics panel**
   - Regular checks on what's available
   - See model sizes before pulling
   - Quick refresh to update

3. **✅ Match model to NPC role**
   - Important NPCs: qwen2.5:14b
   - Simple NPCs: phi or llama2:7b
   - Server/Console: Best model available

4. **✅ Monitor resource usage**
   - `ollama ps` shows active models
   - `htop` or Activity Monitor for RAM
   - Don't run too many large models simultaneously

5. **❌ Don't assume llama2 is installed**
   - Old default, not always present
   - Use qwen2.5 or check available models first

6. **❌ Don't change model mid-conversation**
   - Finish conversation first
   - Then change model
   - Or entity behavior may be inconsistent

---

## Summary

**The Fix:**
- Frontend now auto-detects available models
- Defaults to qwen2.5 or first available
- Shows warnings for unavailable models
- No more llama2 hardcoded defaults

**Your Action:**
1. Check Model Diagnostics panel
2. Pull models you want: `ollama pull qwen2.5:14b-instruct`
3. Update existing entities via Entity Config sidebar
4. New entities will use available models automatically

**Result:**
- ✅ No more "model not found" errors
- ✅ Clear warnings when model unavailable
- ✅ Easy model selection per entity
- ✅ Automatic defaults based on what's installed

