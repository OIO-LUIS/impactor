import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["sidebar", "toggle", "backdrop", "section", "chevron"]
  static values  = { open: { type: Boolean, default: false } }

  connect() {
    this._bindEsc = this.onEsc.bind(this)
    document.addEventListener("keydown", this._bindEsc)
    this.apply()
  }

  disconnect() {
    document.removeEventListener("keydown", this._bindEsc)
  }

  // Drawer
  toggle() { this.openValue = !this.openValue; this.apply() }
  open()   { this.openValue = true;  this.apply() }
  close()  { this.openValue = false; this.apply() }

  onEsc(e) { if (e.key === "Escape" && this.openValue) this.close() }

  apply() {
    const open = this.openValue
    this.sidebarTarget.classList.toggle("is-open", open)
    this.sidebarTarget.setAttribute("aria-hidden", (!open).toString())
    if (this.hasToggleTarget) this.toggleTarget.setAttribute("aria-expanded", open.toString())
    if (this.hasBackdropTarget) {
      this.backdropTarget.classList.toggle("is-visible", open)
      this.backdropTarget.setAttribute("aria-hidden", (!open).toString())
    }
  }

  // Accordion (secciones internas)
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
      // forzar recálculo para transición suave
      content.style.maxHeight = "0px"
      content.style.marginTop = ".75rem"
      requestAnimationFrame(() => {
        content.style.maxHeight = content.scrollHeight + "px"
      })
      if (chev) chev.style.transform = "rotate(180deg)"
    }
  }
}
