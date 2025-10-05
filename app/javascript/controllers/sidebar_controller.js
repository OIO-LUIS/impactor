import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "sidebar", "toggle", "backdrop", "section", "chevron",
    "settingsMenu", "settingsToggle"
  ]
  static values  = {
    open: { type: Boolean, default: false },     // drawer
    mode: { type: String,  default: "drawer" }   // "drawer" | "settings"
  }

  connect() {
    this._bindEsc    = this.onEsc.bind(this)
    this._bindDocClk = this.onDocClick.bind(this)

    document.addEventListener("keydown", this._bindEsc)
    document.addEventListener("click",  this._bindDocClk)

    this.apply()  
  }

  disconnect() {
    document.removeEventListener("keydown", this._bindEsc)
    document.removeEventListener("click",  this._bindDocClk)
  }

  // Drawer
  toggle() { this.openValue = !this.openValue; this.apply() }
  open()   { this.openValue = true;  this.apply() }
  close()  { this.openValue = false; this.apply() }

  apply() {
    if (this.modeValue === "drawer" && this.hasSidebarTarget) {
      const open = this.openValue
      this.sidebarTarget.classList.toggle("is-open", open)
      this.sidebarTarget.setAttribute("aria-hidden", (!open).toString())
      if (this.hasToggleTarget) this.toggleTarget.setAttribute("aria-expanded", open.toString())
      if (this.hasBackdropTarget) {
        this.backdropTarget.classList.toggle("is-visible", open)
        this.backdropTarget.setAttribute("aria-hidden", (!open).toString())
      }
    }
  }

  onEsc(e) {
    if (e.key !== "Escape") return
    if (this.modeValue === "drawer" && this.openValue) this.close()
    if (this.modeValue === "settings" && this.openValue) this.closeSettings()
  }

  onDocClick(e){
    if (this.modeValue === "settings") {
      if (!this.element.contains(e.target)) this.closeSettings()
    }
  }

  toggleSection(event) {
    const key = event.currentTarget.dataset.key
    const content = this.sectionTargets.find(el => el.dataset.key === key)
    const chev    = this.chevronTargets.find(el => el.dataset.key === key)
    if (!content) return

    const open = content.getAttribute("data-open") === "true"
    if (open) {
      content.setAttribute("data-open", "false")
      content.style.maxHeight = "0px"
      content.style.marginTop = "0px"
      if (chev) chev.style.transform = "rotate(0deg)"
    } else {
      content.setAttribute("data-open", "true")
      content.style.maxHeight = "0px"
      content.style.marginTop = ".75rem"
      requestAnimationFrame(() => {
        content.style.maxHeight = content.scrollHeight + "px"
      })
      if (chev) chev.style.transform = "rotate(180deg)"
    }
  }

  toggleSettings(){
    if (this.modeValue !== "settings") return
    this.openValue = !this.openValue
    if (this.hasSettingsToggleTarget) this.settingsToggleTarget.setAttribute("aria-expanded", this.openValue.toString())
    if (this.hasSettingsMenuTarget)   this.settingsMenuTarget.setAttribute("aria-hidden", (!this.openValue).toString())
    this.element.setAttribute("data-sidebar-open-value", this.openValue.toString())
  }

  closeSettings(){
    if (this.modeValue !== "settings" || !this.openValue) return
    this.openValue = false
    if (this.hasSettingsToggleTarget) this.settingsToggleTarget.setAttribute("aria-expanded", "false")
    if (this.hasSettingsMenuTarget)   this.settingsMenuTarget.setAttribute("aria-hidden", "true")
    this.element.setAttribute("data-sidebar-open-value", "false")
  }
}
