#!/usr/bin/env python3
"""
Format Kiro Chat History
Converts raw chat history to proper Kiro.dev markdown format with purple styling
"""

import re
import sys

def format_chat_history(input_file, output_file):
    """Convert raw chat history to proper Kiro chat format with styling"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split content into sections
    lines = content.split('\n')
    formatted_lines = []
    
    # Add styled header with dark theme
    formatted_lines.extend([
        '<div style="background: #0F0F0F; color: white; padding: 0; margin: 0; min-height: 100vh;">',
        '<div style="background: linear-gradient(135deg, #790ECB 0%, #9333EA 100%); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">',
        '<h1 style="color: white; margin: 0; font-size: 2.5rem;">🎮 Pac-Kiro Game Development</h1>',
        '<p style="color: #E5E7EB; margin: 0.5rem 0 0 0; font-size: 1.2rem;">Complete development session from AWS re:Invent 2025 workshop</p>',
        '</div>',
        "",
        '<style>',
        'body { background: #0F0F0F; color: #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2rem; }',
        '.kiro-action { background: #790ECB; color: white; padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.85rem; display: inline-block; margin: 0.2rem 0; }',
        '.kiro-ghost { color: #A855F7; font-size: 0.9rem; font-style: italic; }',
        '.user-msg { border-left: 4px solid #790ECB; padding-left: 1rem; margin: 1.5rem 0; background: #1A1A1A; padding: 1rem; border-radius: 8px; }',
        '.kiro-msg { border-left: 4px solid #9333EA; padding-left: 1rem; margin: 1.5rem 0; background: #1F1F1F; padding: 1rem; border-radius: 8px; }',
        '.session-header { background: linear-gradient(90deg, #790ECB 0%, #9333EA 100%); color: white; padding: 1rem 1.5rem; border-radius: 8px; margin: 2rem 0 1rem 0; }',
        '.feature-box { background: #1A1A1A; border: 1px solid #333; padding: 1rem; border-radius: 8px; margin: 1rem 0; }',
        'pre { background: #0A0A0A; border: 1px solid #333; padding: 1rem; border-radius: 6px; overflow-x: auto; }',
        'code { background: #1A1A1A; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9rem; }',
        'hr { border: none; border-top: 1px solid #333; margin: 2rem 0; }',
        'ul { padding-left: 1.5rem; }',
        'li { margin: 0.5rem 0; line-height: 1.6; }',
        '.feature-list { background: #1A1A1A; border: 1px solid #333; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }',
        '.feature-list ul { margin: 0; }',
        '</style>',
        "",
        "---",
        ""
    ])
    
    current_section = 1
    in_user_message = False
    in_kiro_response = False
    buffer = []
    user_message_buffer = []
    last_was_checkpoint = False
    
    def flush_buffer():
        if buffer:
            # Join buffer and add proper line breaks for lists
            content = '\n'.join(buffer)
            
            # Format checkmark lists into proper bullet points
            content = re.sub(r'✓\s+([^✓✅]+?)(?=\s*✓|\s*✅|$)', r'\n\n✅ \1', content)
            content = re.sub(r'✅\s+([^✓✅]+?)(?=\s*✓|\s*✅|$)', r'\n\n✅ \1', content)
            
            # Add line breaks before other list items
            content = re.sub(r'([.!?])\s*([•-]\s)', r'\1\n\n\2', content)
            content = re.sub(r'([.!?])\s*(\d+\.)', r'\1\n\n\2', content)
            
            # Split back into lines and add to formatted_lines
            for line in content.split('\n'):
                formatted_lines.append(line)
            buffer.clear()
    
    def flush_user_message():
        if user_message_buffer:
            # Join all user message lines together
            full_message = ' '.join(user_message_buffer).strip()
            if full_message:
                formatted_lines.extend([
                    '<div class="user-msg">',
                    f'<strong>👤 User:</strong> {full_message}',
                    '</div>',
                    ""
                ])
            user_message_buffer.clear()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines at start
        if not line and len(formatted_lines) > 10:
            i += 1
            continue
            
        # Detect checkpoint/restore as session breaks
        if line.startswith('Checkpoint') or line.startswith('Restore'):
            flush_buffer()
            flush_user_message()
            if in_kiro_response:
                formatted_lines.append('</div>')
                in_kiro_response = False
            formatted_lines.extend([
                "",
                "---",
                ""
            ])
            last_was_checkpoint = True
            i += 1
            continue
            
        # Detect user messages (not system messages, not Kiro responses)
        if (line and not line.startswith('Kiro') and 
            not line.startswith('Credits used:') and 
            not line.startswith('Elapsed time:') and 
            not line.startswith('Checkpoint') and 
            not line.startswith('Restore') and 
            not line.startswith('Command') and 
            not line.startswith('Searched workspace') and 
            not line.startswith('Read file(s)') and 
            not line.startswith('Created') and 
            not line.startswith('Accepted edits') and 
            not line.startswith('Error(s)') and 
            not line.startswith('Including Steering') and 
            not line.startswith('*') and
            not in_kiro_response):
            
            # Check if this should start a new session (only for major topics)
            if (not user_message_buffer and  # Only if starting fresh
                ('"I want to build' in line or 
                 'Incorporate these sounds' in line or
                 'allow two kiros' in line or
                 'can you write a shell script' in line or
                 'Add a readme' in line)):
                
                formatted_lines.extend([
                    f'<div class="session-header">',
                    f'<h2 style="margin: 0;">Session {current_section}</h2>',
                    '</div>',
                    ""
                ])
                current_section += 1
            
            # Add to user message buffer (accumulate multi-line user messages)
            user_message_buffer.append(line)
            in_user_message = True
            in_kiro_response = False
            last_was_checkpoint = False
            
        # Detect Kiro responses
        elif line.startswith('Kiro'):
            flush_buffer()
            flush_user_message()  # Flush any accumulated user message
            kiro_message = line[4:].strip() if len(line) > 4 else ""
            formatted_lines.extend([
                '<div class="kiro-msg">',
                f'<strong>🤖 Kiro:</strong> {kiro_message}',
                ""
            ])
            in_kiro_response = True
            in_user_message = False
            last_was_checkpoint = False
            
        # Handle system messages and tool outputs
        elif line.startswith('Credits used:') or line.startswith('Elapsed time:'):
            # Skip these for cleaner format
            pass
            
        elif line.startswith('Checkpoint') or line.startswith('Restore'):
            flush_buffer()
            if in_kiro_response:
                formatted_lines.append('</div>')
                in_kiro_response = False
            formatted_lines.extend([
                "",
                "---",
                ""
            ])
            
        elif line.startswith('Command') and not line.strip().endswith('Command'):
            # Has actual command content
            command_content = line[7:].strip() if len(line) > 7 else ""
            if command_content:
                formatted_lines.extend([
                    "```bash",
                    command_content,
                    "```",
                    ""
                ])
            else:
                # Empty command - use ghost action
                formatted_lines.extend([
                    '<span class="kiro-ghost">👻 ...Kiro doing magical things...</span>',
                    ""
                ])
                
        elif line == 'Command':
            # Empty command line
            formatted_lines.extend([
                '<span class="kiro-ghost">👻 ...Kiro working behind the scenes...</span>',
                ""
            ])
            
        elif (line.startswith('Searched workspace') or 
              line.startswith('Read file(s)') or 
              line.startswith('Created') or 
              line.startswith('Accepted edits') or 
              line.startswith('Error(s)') or
              line.startswith('Including Steering')):
            # Format as Kiro action badges
            formatted_lines.extend([
                f'<span class="kiro-action">{line}</span>',
                ""
            ])
            
        # Handle regular content
        elif line and (in_kiro_response or in_user_message):
            # Check for feature lists and format them specially
            if ('Features implemented:' in line or 'What the script does:' in line or 
                'Key improvements:' in line or 'Two-Player Features:' in line):
                buffer.append('<div class="feature-list">')
                buffer.append(line)
                buffer.append('</div>')
            else:
                buffer.append(line)
            
        elif line:
            # Other content
            buffer.append(line)
            
        i += 1
    
    # Flush any remaining buffers
    flush_buffer()
    flush_user_message()
    
    # Close any open divs
    if in_kiro_response:
        formatted_lines.append('</div>')
    
    # Add footer and close dark theme wrapper
    formatted_lines.extend([
        "",
        '<div style="background: linear-gradient(135deg, #790ECB 0%, #9333EA 100%); padding: 1.5rem; border-radius: 12px; margin-top: 3rem; text-align: center;">',
        '<p style="color: white; margin: 0; font-size: 1.1rem;">🎮 Game Development Complete! 🚀</p>',
        '<p style="color: #E5E7EB; margin: 0.5rem 0 0 0;">Built with Kiro AI at AWS re:Invent 2025</p>',
        '</div>',
        '</div>'  # Close the dark theme wrapper
    ])
    
    # Clean up extra empty lines
    cleaned_lines = []
    prev_empty = False
    for line in formatted_lines:
        if not line.strip():
            if not prev_empty:
                cleaned_lines.append("")
            prev_empty = True
        else:
            cleaned_lines.append(line)
            prev_empty = False
    
    # Write formatted content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned_lines))
    
    print(f"✅ Formatted chat history written to {output_file}")
    print(f"📊 Original lines: {len(lines)}")
    print(f"📊 Formatted lines: {len(cleaned_lines)}")
    print(f"🎨 Added Kiro purple styling and ghost emojis!")

if __name__ == "__main__":
    input_file = "KiroChatHistory.md"
    output_file = "KiroDevChatHistory.md"
    
    try:
        format_chat_history(input_file, output_file)
    except FileNotFoundError:
        print(f"❌ Error: {input_file} not found")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)