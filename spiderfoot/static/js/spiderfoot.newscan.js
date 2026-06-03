// New Scan page: reactive tri-column selection (Profiles / Required Data / Modules).
//
// The Module column is the single source of truth (what actually runs). The
// Profiles and Required Data columns are independent "drivers" that set the
// module selection; manual module tweaks then refine it. Built-in profiles are
// templates, not constraints — nothing is ever blocked, only flagged.

var selectedMods = {};   // module id -> true when enabled (the source of truth)

function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Dependency resolution (ported from sflib modulesProducing + closure) ---

// Modules whose produced events intersect the requested types ('*' = any).
function modulesProducing(types) {
    var set = {};
    var star = types.indexOf('*') >= 0;
    for (var mid in MODULES) {
        var prov = MODULES[mid].provides || [];
        if (!prov.length) continue;
        if (star) { set[mid] = true; continue; }
        for (var i = 0; i < prov.length; i++) {
            if (types.indexOf(prov[i]) >= 0) { set[mid] = true; break; }
        }
    }
    return set;
}

// Full module set needed to gather the requested data types: the modules that
// produce them, plus (recursively) the modules that feed what those consume.
function resolveFromDataTypes(types) {
    if (!types.length) return {};
    var modset = modulesProducing(types);
    var frontier = Object.keys(modset);
    while (frontier.length) {
        var consumed = {};
        frontier.forEach(function(mid) {
            (MODULES[mid].consumes || []).forEach(function(t) { consumed[t] = true; });
        });
        var producers = modulesProducing(Object.keys(consumed));
        var next = [];
        for (var mid in producers) {
            if (!modset[mid]) { modset[mid] = true; next.push(mid); }
        }
        frontier = next;
    }
    return modset;
}

// --- Rendering ---

function moduleBadges(mid) {
    var m = MODULES[mid];
    var b = "";
    if (m.needsKey) {
        var cls = m.keyConfigured ? "ns-key-ok" : "ns-key-missing";
        var t = m.keyConfigured ? "API key configured" : "API key required (not configured)";
        b += " <span class='ns-badge " + cls + "' title='" + t + "'><i class='glyphicon glyphicon-lock'></i></span>";
    }
    (m.flags || []).forEach(function(f) {
        if (f === "apikey") return;
        if (f === "invasive") b += " <span class='ns-badge ns-invasive' title='Touches the target directly'>invasive</span>";
        else if (f === "slow") b += " <span class='ns-badge ns-slow' title='Slow to run'>slow</span>";
        else if (f === "tool") b += " <span class='ns-badge ns-tool' title='Needs an external CLI tool installed'>tool</span>";
        else if (f === "tor") b += " <span class='ns-badge ns-tor' title='Routes via TOR'>tor</span>";
        else if (f === "errorprone") b += " <span class='ns-badge ns-flaky' title='May be error-prone'>flaky</span>";
    });
    return b;
}

function renderProfiles() {
    var html = "";
    PROFILES.forEach(function(p) {
        html += "<div class='ns-profile' data-profile='" + p + "'>" + p + "</div>";
    });
    if (CUSTOM_PROFILES.length) {
        html += "<div class='newscan-col-sub' style='padding-top:8px'>Custom</div>";
        CUSTOM_PROFILES.forEach(function(p) {
            html += "<div class='ns-profile ns-custom' data-custom='" + escapeHtml(p.name) + "'>"
                  + "<span class='ns-custom-name'>" + escapeHtml(p.name) + "</span>"
                  + "<a href='#' class='ns-del-profile' data-name='" + escapeHtml(p.name) + "' title='Delete profile'>&times;</a>"
                  + "</div>";
        });
    }
    $("#profile-list").html(html);
}

function applyCustomProfile(name) {
    var prof = null;
    for (var i = 0; i < CUSTOM_PROFILES.length; i++) {
        if (CUSTOM_PROFILES[i].name === name) prof = CUSTOM_PROFILES[i];
    }
    if (!prof) return;
    selectedMods = {};
    prof.modules.forEach(function(mid) { if (MODULES[mid]) selectedMods[mid] = true; });
    $(".ns-data").prop("checked", false);
    syncModuleChecks();
}

function saveProfile() {
    var mods = Object.keys(selectedMods).filter(function(m) { return selectedMods[m] && MODULES[m]; });
    if (mods.length === 0) {
        alertify.error("Select some modules before saving a profile.");
        return;
    }
    var name = window.prompt("Save this module selection as a profile named:");
    if (!name || !name.trim()) return;
    name = name.trim();
    sf.fetchData(docroot + "/saveprofile",
        { name: name, modules: mods.map(function(m) { return "module_" + m; }).join(",") },
        function(ret) {
            if (!ret || ret[0] !== "SUCCESS") {
                alertify.error((ret && ret[1]) || "Failed to save profile.");
                return;
            }
            CUSTOM_PROFILES = CUSTOM_PROFILES.filter(function(p) { return p.name !== name; });
            CUSTOM_PROFILES.push({ name: name, modules: mods });
            CUSTOM_PROFILES.sort(function(a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
            renderProfiles();
            $(".ns-custom").each(function() {
                if ($(this).attr("data-custom") === name) $(this).addClass("active");
            });
            alertify.success("Profile saved: " + name);
        });
}

function deleteProfile(name) {
    if (!window.confirm("Delete the profile \"" + name + "\"?")) return;
    sf.fetchData(docroot + "/deleteprofile", { name: name }, function(ret) {
        if (!ret || ret[0] !== "SUCCESS") {
            alertify.error((ret && ret[1]) || "Failed to delete profile.");
            return;
        }
        CUSTOM_PROFILES = CUSTOM_PROFILES.filter(function(p) { return p.name !== name; });
        renderProfiles();
        alertify.success("Profile deleted: " + name);
    });
}

function renderDataTypes() {
    var html = "";
    DATATYPES.forEach(function(d) {
        // d = [label, code]
        html += "<label class='ns-item' data-search='" + escapeHtml((d[0] + " " + d[1]).toLowerCase()) + "'>"
              + "<input type='checkbox' class='ns-data' id='type_" + escapeHtml(d[1]) + "' data-code='" + escapeHtml(d[1]) + "'> "
              + "<span class='ns-name'>" + escapeHtml(d[0]) + "</span></label>";
    });
    $("#datatype-list").html(html);
}

function renderModules() {
    var ids = Object.keys(MODULES).sort(function(a, b) {
        var an = MODULES[a].name.toUpperCase(), bn = MODULES[b].name.toUpperCase();
        return an < bn ? -1 : (an > bn ? 1 : 0);
    });
    var html = "";
    ids.forEach(function(mid) {
        var m = MODULES[mid];
        html += "<label class='ns-item' data-mid='" + mid + "' data-search='" + escapeHtml((m.name + " " + mid).toLowerCase()) + "' title='" + escapeHtml(m.descr) + "'>"
              + "<input type='checkbox' class='ns-mod' id='module_" + mid + "' data-mid='" + mid + "'> "
              + "<span class='ns-name'>" + escapeHtml(m.name) + "</span>" + moduleBadges(mid) + "</label>";
    });
    $("#module-list").html(html);
    syncModuleChecks();
}

// Push the selectedMods state into the rendered module checkboxes.
function syncModuleChecks() {
    $(".ns-mod").each(function() {
        var mid = $(this).attr("data-mid");
        this.checked = !!selectedMods[mid];
    });
    updateSummary();
}

// --- Selection drivers ---

function applyProfile(name) {
    selectedMods = {};
    for (var mid in MODULES) {
        if (name === "All" || (MODULES[mid].group || []).indexOf(name) >= 0) {
            selectedMods[mid] = true;
        }
    }
    // Profile is now the active driver; clear the data-type selection display.
    $(".ns-data").prop("checked", false);
    $(".ns-profile").removeClass("active");
    $(".ns-profile[data-profile='" + name + "']").addClass("active");
    syncModuleChecks();
}

function applyDataTypes() {
    var types = [];
    $(".ns-data:checked").each(function() { types.push($(this).attr("data-code")); });
    selectedMods = resolveFromDataTypes(types);
    // Data is now the active driver; clear the profile highlight.
    $(".ns-profile").removeClass("active");
    syncModuleChecks();
}

function onModuleToggle(mid, checked) {
    if (checked) selectedMods[mid] = true;
    else delete selectedMods[mid];
    // A manual tweak means we've deviated from any pristine profile.
    $(".ns-profile").removeClass("active");
    updateSummary();
}

// --- Summary ---

function updateSummary() {
    var mods = Object.keys(selectedMods).filter(function(m) { return selectedMods[m] && MODULES[m]; });
    var dataTypes = {}, needKey = 0, unconfigured = 0, invasive = 0;
    mods.forEach(function(mid) {
        var m = MODULES[mid];
        (m.provides || []).forEach(function(t) { dataTypes[t] = true; });
        if (m.needsKey) { needKey++; if (!m.keyConfigured) unconfigured++; }
        if ((m.flags || []).indexOf("invasive") >= 0) invasive++;
    });
    var total = Object.keys(MODULES).length;
    var html = "Will collect <b>" + Object.keys(dataTypes).length + "</b> data types &middot; "
             + "<b>" + mods.length + "</b> of " + total + " modules &middot; "
             + "<b>" + needKey + "</b> need API keys";
    if (unconfigured > 0) html += " <span class='text-danger'>(" + unconfigured + " unconfigured)</span>";
    if (invasive > 0) html += " &middot; <span class='text-danger'>" + invasive + " invasive</span>";
    $("#scan-summary").html(html);
    $("#module-count").text("(" + mods.length + " selected)");
}

// --- Select all / none (acts on the currently-visible/filtered rows) ---

function setVisibleModules(on) {
    $("#module-list .ns-item:visible .ns-mod").each(function() {
        var mid = $(this).attr("data-mid");
        if (on) selectedMods[mid] = true; else delete selectedMods[mid];
    });
    $(".ns-profile").removeClass("active");
    syncModuleChecks();
}

function setVisibleDataTypes(on) {
    $("#datatype-list .ns-item:visible .ns-data").prop("checked", on);
    applyDataTypes();
}

// --- Filters ---

function applyFilter(inputId, listId) {
    var q = $(inputId).val().toLowerCase();
    $(listId + " .ns-item").each(function() {
        var hay = $(this).attr("data-search") || "";
        $(this).toggle(hay.indexOf(q) >= 0);
    });
}

// --- Submit ---

function submitForm() {
    var mods = Object.keys(selectedMods).filter(function(m) { return selectedMods[m] && MODULES[m]; });
    if (mods.length === 0) {
        alertify.error("Select at least one module (pick a profile, some data, or modules directly).");
        return false;
    }
    $("#modulelist").val(mods.map(function(m) { return "module_" + m; }).join(","));
    $("#typelist").val("");
    $("#usecase").val("");
    return true;
}

$(document).ready(function() {
    renderProfiles();
    renderDataTypes();
    renderModules();

    // Initial state: a re-run/clone pre-selects modules, otherwise default to All.
    if (PRESELECTED_MODS && PRESELECTED_MODS !== "") {
        selectedMods = {};
        PRESELECTED_MODS.split(",").forEach(function(m) {
            m = m.replace("module_", "").trim();
            if (m && MODULES[m]) selectedMods[m] = true;
        });
        syncModuleChecks();
    } else {
        applyProfile("All");
    }

    $("#profile-list").on("click", ".ns-profile[data-profile]", function() {
        applyProfile($(this).attr("data-profile"));
    });
    $("#profile-list").on("click", ".ns-custom", function(e) {
        if ($(e.target).hasClass("ns-del-profile")) return;
        $(".ns-profile").removeClass("active");
        $(this).addClass("active");
        applyCustomProfile($(this).attr("data-custom"));
    });
    $("#profile-list").on("click", ".ns-del-profile", function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteProfile($(this).attr("data-name"));
    });
    $("#btn-save-profile").on("click", function(e) {
        e.preventDefault();
        saveProfile();
    });
    $("#datatype-list").on("change", ".ns-data", function() {
        applyDataTypes();
    });
    $("#module-list").on("change", ".ns-mod", function() {
        onModuleToggle($(this).attr("data-mid"), this.checked);
    });
    $("#module-filter").on("keyup", function() { applyFilter("#module-filter", "#module-list"); });
    $("#datatype-filter").on("keyup", function() { applyFilter("#datatype-filter", "#datatype-list"); });

    $("#mod-all").on("click", function(e) { e.preventDefault(); setVisibleModules(true); });
    $("#mod-none").on("click", function(e) { e.preventDefault(); setVisibleModules(false); });
    $("#data-all").on("click", function(e) { e.preventDefault(); setVisibleDataTypes(true); });
    $("#data-none").on("click", function(e) { e.preventDefault(); setVisibleDataTypes(false); });

    $("form").on("submit", function() { return submitForm(); });

    $('#scantarget').popover({ 'html': true, 'animation': true, 'trigger': 'focus' });
});
