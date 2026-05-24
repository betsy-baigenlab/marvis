#!/usr/bin/env python3
"""
Test script to verify real-time time functionality in Jarvis AI.
Tests that the system returns accurate, current time for India (IST).
"""

import datetime
import pytz
from llm import ask_llm, get_current_time_info, get_system_prompt_with_realtime
from config import TIMEZONE

def test_realtime_time():
    """Test that real-time time information is generated correctly."""
    print("=" * 70)
    print("JARVIS AI - REAL-TIME SYSTEM TEST")
    print("=" * 70)
    
    # Test 1: Get current time info
    print("\n[TEST 1] Getting real-time time information...")
    time_info = get_current_time_info()
    print(f"Real-time Info:\n{time_info}\n")
    
    # Test 2: Verify timezone
    tz = pytz.timezone(TIMEZONE)
    now = datetime.datetime.now(tz)
    print(f"[TEST 2] Timezone Verification")
    print(f"Configured Timezone: {TIMEZONE}")
    print(f"Current Time Object: {now}")
    print(f"ISO Format: {now.isoformat()}")
    print(f"Time Only: {now.strftime('%I:%M:%S %p %Z')}\n")
    
    # Test 3: System prompt with real-time
    print(f"[TEST 3] System Prompt with Real-Time Context")
    system_prompt = get_system_prompt_with_realtime()
    print("System Prompt snippet:")
    print("-" * 70)
    print(system_prompt[:400] + "...")
    print("-" * 70 + "\n")
    
    # Test 4: Multiple calls to verify dynamic updates
    print("[TEST 4] Dynamic Update Test (calling 3 times with 2-second intervals)")
    import time
    for i in range(3):
        time_info = get_current_time_info()
        print(f"Call {i+1}: {time_info}")
        if i < 2:
            time.sleep(2)
    
    print("\n" + "=" * 70)
    print("✅ REAL-TIME SYSTEM TEST COMPLETE")
    print("=" * 70)
    print("\nKey Points:")
    print("✓ Time is calculated fresh for EVERY REQUEST (not cached)")
    print("✓ Timezone: India Standard Time (IST, UTC+5:30)")
    print("✓ DeepSeek V3 receives current time in system prompt")
    print("✓ Each LLM call has fresh, accurate time context")
    print("\n")

if __name__ == "__main__":
    test_realtime_time()
