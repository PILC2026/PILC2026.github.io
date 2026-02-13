import { db } from '../firebase-config.js';
import { 
    doc, 
    getDoc, 
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Content editor loaded");
    
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        console.log("Non-admin user, content editing disabled");
        return;
    }
    
    console.log("Admin user detected, initializing content editor");
    
    // Add admin indicator class to body
    document.body.classList.add('admin-mode');
    
    // Initialize edit buttons for sections
    initializeEditButtons();
    
    // Initialize accordion header editing
    initializeAccordionHeaderEditing();
    
    // Initialize edit modal handlers
    const editModal = document.getElementById('contentEditModal');
    if (editModal) {
        const saveButton = editModal.querySelector('#saveContentBtn');
        if (saveButton) {
            saveButton.addEventListener('click', saveContent);
        }
        
        // Initialize rich text editor when modal is shown
        editModal.addEventListener('shown.bs.modal', initializeRichTextEditor);
    }
    
    // Load saved content from Firebase
    loadContent();
});

// ============================================
// EDIT BUTTONS FOR EDITABLE SECTIONS
// ============================================

function initializeEditButtons() {
    const editableSections = document.querySelectorAll('.editable-section');
    
    editableSections.forEach(section => {
        // Skip if already has edit button
        if (section.querySelector('.edit-button')) return;
        
        // Create edit button
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<i class="bi bi-pencil"></i> <span>Edit</span>';
        editButton.dataset.sectionId = section.id;
        
        // Add click handler
        editButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openEditModal(section);
        });
        
        // Append to section
        section.appendChild(editButton);
    });
}

// ============================================
// ACCORDION HEADER EDITING (Day titles)
// ============================================

function initializeAccordionHeaderEditing() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach((header, index) => {
        // Create unique ID for saving
        const headerId = `accordionHeader_${index}`;
        header.dataset.headerId = headerId;
        
        // Create edit button for header
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<i class="bi bi-pencil"></i>';
        editButton.title = 'Edit day title';
        
        // Add click handler
        editButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openHeaderEditModal(header);
        });
        
        // Append to header
        header.appendChild(editButton);
    });
}

// Open inline edit for accordion header
function openHeaderEditModal(header) {
    const accordionButton = header.querySelector('.accordion-button');
    if (!accordionButton) return;
    
    const currentText = accordionButton.textContent.trim();
    const headerId = header.dataset.headerId;
    
    // Create inline edit input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'form-control header-inline-edit';
    input.style.cssText = `
        position: absolute;
        top: 50%;
        left: 20px;
        right: 80px;
        transform: translateY(-50%);
        z-index: 100;
        font-weight: 600;
        font-size: 1.1rem;
        padding: 10px 16px;
        border-radius: 8px;
        border: 2px solid #356FBE;
        box-shadow: 0 4px 12px rgba(53, 111, 190, 0.2);
    `;
    
    // Hide original button text
    accordionButton.style.color = 'transparent';
    
    // Add input to header
    header.style.position = 'relative';
    header.appendChild(input);
    input.focus();
    input.select();
    
    // Save on Enter or blur
    const saveEdit = async () => {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            accordionButton.textContent = newText;
            
            // Save to Firebase
            try {
                const contentRef = doc(db, "siteContent", headerId);
                await setDoc(contentRef, {
                    content: newText,
                    type: 'accordionHeader',
                    updatedAt: serverTimestamp(),
                    updatedBy: localStorage.getItem('userId')
                }, { merge: true });
                
                showAlert('Day title updated!', 'success');
            } catch (error) {
                console.error("Error saving header:", error);
                showAlert('Error saving: ' + error.message, 'danger');
            }
        }
        
        // Cleanup
        accordionButton.style.color = '';
        input.remove();
    };
    
    // Cancel on Escape
    const cancelEdit = () => {
        accordionButton.style.color = '';
        input.remove();
    };
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
    
    input.addEventListener('blur', saveEdit);
}

// ============================================
// EDIT MODAL FOR SECTIONS
// ============================================

function openEditModal(section) {
    const modal = new bootstrap.Modal(document.getElementById('contentEditModal'));
    const modalTitle = document.getElementById('editModalLabel');
    
    // Set modal title
    modalTitle.textContent = `Edit: ${section.dataset.title || section.id}`;
    
    // Store section ID for saving
    document.getElementById('currentSectionId').value = section.id;
    
    // Show modal
    modal.show();
    
    // Set content after modal is shown
    setTimeout(() => {
        const richTextEditor = document.getElementById('richTextEditor');
        const livePreview = document.getElementById('livePreview');
        
        if (richTextEditor && livePreview) {
            // Clone section and remove edit button
            const sectionClone = section.cloneNode(true);
            const editButton = sectionClone.querySelector('.edit-button');
            if (editButton) editButton.remove();
            
            const content = sectionClone.innerHTML;
            richTextEditor.innerHTML = content;
            livePreview.innerHTML = content;
        }
    }, 100);
}

// ============================================
// RICH TEXT EDITOR
// ============================================

function initializeRichTextEditor() {
    const richTextEditor = document.getElementById('richTextEditor');
    const livePreview = document.getElementById('livePreview');
    const toolbar = document.querySelector('.editor-toolbar');
    
    if (!richTextEditor || !livePreview || !toolbar) return;
    
    // Update live preview when editor content changes
    richTextEditor.addEventListener('input', function() {
        livePreview.innerHTML = richTextEditor.innerHTML;
    });
    
    // Toolbar button handlers
    toolbar.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-command]');
        if (button) {
            e.preventDefault();
            const command = button.dataset.command;
            
            richTextEditor.focus();
            document.execCommand(command, false, null);
            livePreview.innerHTML = richTextEditor.innerHTML;
            updateToolbarStates();
        }
    });
    
    // Heading select handler
    const headingSelect = document.getElementById('headingSelect');
    if (headingSelect) {
        headingSelect.addEventListener('change', function() {
            const value = this.value;
            richTextEditor.focus();
            
            if (value) {
                document.execCommand('formatBlock', false, value);
            } else {
                document.execCommand('formatBlock', false, 'div');
            }
            
            livePreview.innerHTML = richTextEditor.innerHTML;
            updateToolbarStates();
        });
    }
    
    // Hyperlink button handler
    const hyperlinkBtn = document.getElementById('hyperlinkBtn');
    if (hyperlinkBtn) {
        hyperlinkBtn.addEventListener('click', function() {
            richTextEditor.focus();
            
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            let url = prompt('Enter the URL:', 'https://');
            if (url && url.trim()) {
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                
                if (selectedText) {
                    document.execCommand('createLink', false, url);
                } else {
                    const linkHtml = `<a href="${url}" target="_blank">${url}</a>`;
                    document.execCommand('insertHTML', false, linkHtml);
                }
                
                livePreview.innerHTML = richTextEditor.innerHTML;
                updateToolbarStates();
            }
        });
    }
    
    // Update toolbar states
    richTextEditor.addEventListener('keyup', updateToolbarStates);
    richTextEditor.addEventListener('mouseup', updateToolbarStates);
    
    function updateToolbarStates() {
        const commands = ['bold', 'italic', 'underline'];
        
        commands.forEach(command => {
            const button = toolbar.querySelector(`[data-command="${command}"]`);
            if (button) {
                if (document.queryCommandState(command)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
        
        const headingSelect = document.getElementById('headingSelect');
        if (headingSelect) {
            const block = document.queryCommandValue('formatBlock');
            if (block && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(block.toLowerCase())) {
                headingSelect.value = block.toLowerCase();
            } else {
                headingSelect.value = '';
            }
        }
    }
    
    // Keyboard shortcuts
    richTextEditor.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold');
                    livePreview.innerHTML = richTextEditor.innerHTML;
                    updateToolbarStates();
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic');
                    livePreview.innerHTML = richTextEditor.innerHTML;
                    updateToolbarStates();
                    break;
                case 'u':
                    e.preventDefault();
                    document.execCommand('underline');
                    livePreview.innerHTML = richTextEditor.innerHTML;
                    updateToolbarStates();
                    break;
            }
        }
    });
    
    // Handle paste - clean up content
    richTextEditor.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
        
        setTimeout(() => {
            livePreview.innerHTML = richTextEditor.innerHTML;
        }, 10);
    });
    
    updateToolbarStates();
}

// ============================================
// SAVE CONTENT
// ============================================

async function saveContent() {
    const sectionId = document.getElementById('currentSectionId').value;
    const section = document.getElementById(sectionId);
    const richTextEditor = document.getElementById('richTextEditor');
    
    if (!section || !richTextEditor) return;
    
    const content = richTextEditor.innerHTML;
    
    try {
        // Save to Firebase
        const contentRef = doc(db, "siteContent", sectionId);
        await setDoc(contentRef, {
            content: content,
            type: 'section',
            updatedAt: serverTimestamp(),
            updatedBy: localStorage.getItem('userId')
        }, { merge: true });
        
        // Update section content
        updateSectionContent(section, content);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('contentEditModal'));
        modal.hide();
        
        showAlert('Content updated successfully!', 'success');
        
    } catch (error) {
        console.error("Error saving content:", error);
        showAlert('Error saving content: ' + error.message, 'danger');
    }
}

// ============================================
// UPDATE SECTION CONTENT
// ============================================

function updateSectionContent(section, newContent) {
    // Check for functional elements that need preserving
    const hasFunctionalElements = section.querySelector('#lunchTitle, #pizzaChoice, #clearPizzaBtn, #massageTimeSlot, #bookMassageBtn');
    
    if (hasFunctionalElements) {
        console.log('Updating section with functional elements:', section.id);
        
        // Parse new content
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${newContent}</div>`, 'text/html');
        const newContentDiv = doc.body.firstChild;
        
        // Remove non-functional children
        const children = Array.from(section.children);
        children.forEach(child => {
            if (!child.classList.contains('edit-button') && 
                !child.id?.includes('lunch') && 
                !child.id?.includes('pizza') &&
                !child.id?.includes('massage')) {
                child.remove();
            }
        });
        
        // Add new content
        Array.from(newContentDiv.children).forEach(child => {
            if (!child.classList.contains('edit-button')) {
                section.insertBefore(child.cloneNode(true), section.querySelector('.edit-button'));
            }
        });
        
        // Reinitialize functional elements
        setTimeout(() => {
            if (window.reinitializePizzaSelection) {
                window.reinitializePizzaSelection();
            }
        }, 100);
        
    } else {
        // Simple content replacement
        section.innerHTML = newContent;
    }
    
    // Re-add edit button if missing
    if (!section.querySelector('.edit-button')) {
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<i class="bi bi-pencil"></i> <span>Edit</span>';
        editButton.dataset.sectionId = section.id;
        editButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openEditModal(section);
        });
        section.appendChild(editButton);
    }
}

// ============================================
// LOAD CONTENT FROM FIREBASE
// ============================================

async function loadContent() {
    // Load editable sections
    const editableSections = document.querySelectorAll('.editable-section');
    
    for (const section of editableSections) {
        try {
            const contentRef = doc(db, "siteContent", section.id);
            const contentSnap = await getDoc(contentRef);
            
            if (contentSnap.exists() && contentSnap.data().content) {
                updateSectionContent(section, contentSnap.data().content);
            }
        } catch (error) {
            console.error(`Error loading content for section ${section.id}:`, error);
        }
    }
    
    // Load accordion headers
    const accordionHeaders = document.querySelectorAll('.accordion-header[data-header-id]');
    
    for (const header of accordionHeaders) {
        try {
            const headerId = header.dataset.headerId;
            const contentRef = doc(db, "siteContent", headerId);
            const contentSnap = await getDoc(contentRef);
            
            if (contentSnap.exists() && contentSnap.data().content) {
                const accordionButton = header.querySelector('.accordion-button');
                if (accordionButton) {
                    accordionButton.textContent = contentSnap.data().content;
                }
            }
        } catch (error) {
            console.error(`Error loading header ${header.dataset.headerId}:`, error);
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        // Create alert container if missing
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; max-width: 350px;';
        document.body.appendChild(container);
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.style.cssText = 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 12px;';
    alert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    (document.getElementById('alertContainer') || document.body).appendChild(alert);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 3000);
}

// Export for external use
window.contentEditor = {
    openEditModal,
    openHeaderEditModal,
    loadContent,
    showAlert
};