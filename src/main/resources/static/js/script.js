
/* TIMER */

const timerDisplay = document.querySelector("#timer-display");
const todayTotal = document.querySelector("#today-total");
const timerMessage = document.querySelector("#timer-message");

const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const resetButton = document.querySelector("#reset-button");

const countdownSettings = document.querySelector("#countdown-settings");
const timerMinutes = document.querySelector("#timer-minutes");

const tabButtons = document.querySelectorAll(".tab-button");

let timerMode = "stopwatch";
let timerSeconds = 0;
let remainingSeconds = 0;
let timerInterval = null;
let timerRunning = false;
let sessionFinished = false;

let todayStudySeconds = 0;
let pendingStudySeconds = 0;

const studyRecords = [];


function formatTime(totalSeconds) {

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");

}


function updateTimerDisplay() {

    const seconds = timerMode === "stopwatch"
        ? timerSeconds
        : remainingSeconds;

    timerDisplay.textContent = formatTime(seconds);

}


function updateTodayTotal() {

    todayTotal.textContent = formatTime(todayStudySeconds);

}


function renderRecords() {

    const recordList = document.querySelector("#record-list");

    recordList.replaceChildren();

    if (studyRecords.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "아직 저장된 공부 기록이 없어.";

        recordList.appendChild(emptyMessage);

        return;

    }

    studyRecords.forEach((record, index) => {

        const item = document.createElement("div");
        item.className = "record-item";

        const description = document.createElement("span");
        description.textContent = record.label;

        const duration = document.createElement("span");
        duration.textContent = formatTime(record.seconds);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "삭제";

        deleteButton.addEventListener("click", () => {

            todayStudySeconds -= record.seconds;

            studyRecords.splice(index, 1);

            updateTodayTotal();
            renderRecords();

        });

        const information = document.createElement("div");

        information.append(description, duration);

        item.append(information, deleteButton);

        recordList.appendChild(item);

    });

}


function saveStudyRecord(seconds, label) {

    if (seconds <= 0) {
        return;
    }

    studyRecords.push({
        seconds: seconds,
        label: label
    });

    todayStudySeconds += seconds;

    updateTodayTotal();
    renderRecords();

}


function stopTimer() {

    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;

    startButton.disabled = false;

}


function finishTimer() {

    stopTimer();

    sessionFinished = true;
    pendingStudySeconds = timerMode === "stopwatch"
        ? timerSeconds
        : Math.max(
            0,
            Number(timerMinutes.value) * 60 - remainingSeconds
        );

    timerMessage.textContent =
        `공부 시간 ${formatTime(pendingStudySeconds)}. 기록을 저장할까요?`;

    const saveButton = document.createElement("button");

    saveButton.type = "button";
    saveButton.className = "button button-primary";
    saveButton.textContent = "기록 저장";

    saveButton.addEventListener("click", () => {

        saveStudyRecord(
            pendingStudySeconds,
            timerMode === "stopwatch" ? "스톱워치" : "카운트다운"
        );

        timerMessage.textContent = "공부 기록을 저장했어!";

        sessionFinished = false;
        pendingStudySeconds = 0;

        saveButton.remove();

    });

    const oldSaveButton = document.querySelector("#save-session-button");

    if (oldSaveButton) {
        oldSaveButton.remove();
    }

    saveButton.id = "save-session-button";

    timerMessage.appendChild(document.createTextNode(" "));
    timerMessage.appendChild(saveButton);

}


function tickTimer() {

    if (timerMode === "stopwatch") {

        timerSeconds += 1;

    } else {

        remainingSeconds -= 1;

        if (remainingSeconds <= 0) {

            remainingSeconds = 0;

            updateTimerDisplay();
            finishTimer();

            timerMessage.prepend(
                document.createTextNode("목표 시간이 끝났어! ")
            );

            return;

        }

    }

    updateTimerDisplay();

}


function startTimer() {

    if (timerRunning || sessionFinished) {
        return;
    }

    if (timerMode === "countdown" && remainingSeconds <= 0) {

        const minutes = Number(timerMinutes.value);

        if (!Number.isFinite(minutes) || minutes < 1) {

            timerMessage.textContent = "목표 시간을 1분 이상 입력해 줘.";

            return;

        }

        remainingSeconds = Math.floor(minutes * 60);

    }

    timerMessage.textContent = "";

    timerRunning = true;
    startButton.disabled = true;

    timerInterval = setInterval(tickTimer, 1000);

}


function pauseTimer() {

    if (!timerRunning) {
        return;
    }

    stopTimer();

    timerMessage.textContent = "타이머를 일시정지했어.";

}


function resetTimer() {

    stopTimer();

    timerSeconds = 0;

    remainingSeconds = timerMode === "countdown"
        ? Math.max(1, Number(timerMinutes.value) || 25) * 60
        : 0;

    sessionFinished = false;
    pendingStudySeconds = 0;

    timerMessage.textContent = "";

    const saveButton = document.querySelector("#save-session-button");

    if (saveButton) {
        saveButton.remove();
    }

    updateTimerDisplay();

}


tabButtons.forEach((button) => {

    button.addEventListener("click", () => {

        stopTimer();

        timerMode = button.dataset.mode;

        tabButtons.forEach((tab) => {
            tab.classList.toggle("active", tab === button);
        });

        countdownSettings.classList.toggle(
            "hidden",
            timerMode !== "countdown"
        );

        timerSeconds = 0;

        remainingSeconds = timerMode === "countdown"
            ? Math.max(1, Number(timerMinutes.value) || 25) * 60
            : 0;

        sessionFinished = false;
        pendingStudySeconds = 0;

        timerMessage.textContent = "";

        const saveButton = document.querySelector("#save-session-button");

        if (saveButton) {
            saveButton.remove();
        }

        updateTimerDisplay();

    });

});


timerMinutes.addEventListener("change", () => {

    if (!timerRunning && timerMode === "countdown") {
        resetTimer();
    }

});


startButton.addEventListener("click", startTimer);

pauseButton.addEventListener("click", pauseTimer);

resetButton.addEventListener("click", resetTimer);


document.querySelector("#manual-save-button").addEventListener("click", () => {

    const hours = Number(document.querySelector("#manual-hours").value);
    const minutes = Number(document.querySelector("#manual-minutes").value);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 24 ||
        minutes < 0 ||
        minutes > 59 ||
        hours * 60 + minutes <= 0
    ) {

        timerMessage.textContent = "시간과 분을 올바르게 입력해 줘.";

        return;

    }

    const totalSeconds = hours * 3600 + minutes * 60;

    saveStudyRecord(totalSeconds, "직접 입력");

    document.querySelector("#manual-hours").value = "";
    document.querySelector("#manual-minutes").value = "";

    timerMessage.textContent = "공부 시간을 기록에 추가했어!";

});


/* CALENDAR */

const calendarMonth = document.querySelector("#calendar-month");
const calendarDays = document.querySelector("#calendar-days");
const selectedDateTitle = document.querySelector("#selected-date-title");

const scheduleForm = document.querySelector("#schedule-form");
const scheduleTitle = document.querySelector("#schedule-title");
const scheduleType = document.querySelector("#schedule-type");
const scheduleList = document.querySelector("#schedule-list");

const scheduleTypes = {
    study: "공부",
    lecture: "강의",
    deadline: "마감"
};

const today = new Date();

let displayedYear = today.getFullYear();
let displayedMonth = today.getMonth();

let selectedDate = formatDate(today);

const schedules = [];

let nextScheduleId = 1;


function formatDate(date) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function renderCalendar() {

    calendarMonth.textContent =
        `${displayedYear}년 ${displayedMonth + 1}월`;

    calendarDays.replaceChildren();

    const firstDay = new Date(displayedYear, displayedMonth, 1).getDay();

    const lastDate = new Date(
        displayedYear,
        displayedMonth + 1,
        0
    ).getDate();

    for (let i = 0; i < firstDay; i += 1) {

        const blank = document.createElement("div");

        calendarDays.appendChild(blank);

    }

    for (let day = 1; day <= lastDate; day += 1) {

        const date = new Date(displayedYear, displayedMonth, day);
        const dateKey = formatDate(date);

        const dayButton = document.createElement("button");

        dayButton.type = "button";
        dayButton.className = "calendar-day";

        if (dateKey === formatDate(today)) {
            dayButton.classList.add("today");
        }

        if (dateKey === selectedDate) {
            dayButton.classList.add("selected");
        }

        const number = document.createElement("span");

        number.className = "day-number";
        number.textContent = day;

        dayButton.appendChild(number);

        const daySchedules = schedules.filter(
            (schedule) => schedule.date === dateKey
        );

        daySchedules.slice(0, 2).forEach((schedule) => {

            const event = document.createElement("span");

            event.className = `calendar-event event-${schedule.type}`;
            event.textContent = schedule.title;
            event.title = schedule.title;

            dayButton.appendChild(event);

        });

        if (daySchedules.length > 2) {

            const more = document.createElement("span");

            more.className = "more-events";
            more.textContent = `+${daySchedules.length - 2}개`;

            dayButton.appendChild(more);

        }

        dayButton.addEventListener("click", () => {

            selectedDate = dateKey;

            renderCalendar();
            renderSchedules();

        });

        calendarDays.appendChild(dayButton);

    }

}


function renderSchedules() {

    selectedDateTitle.textContent =
        `${selectedDate} 일정`;

    scheduleList.replaceChildren();

    const daySchedules = schedules.filter(
        (schedule) => schedule.date === selectedDate
    );

    if (daySchedules.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "등록된 일정이 없어.";

        scheduleList.appendChild(emptyMessage);

    }

    daySchedules.forEach((schedule) => {

        const item = document.createElement("div");

        item.className = "schedule-item";

        if (schedule.completed) {
            item.classList.add("completed");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = schedule.completed;
        checkbox.setAttribute(
            "aria-label",
            `${schedule.title} 완료 여부`
        );

        checkbox.addEventListener("change", () => {

            schedule.completed = checkbox.checked;

            renderCalendar();
            renderSchedules();
            updateCompletedCount();

        });

        const content = document.createElement("div");

        content.className = "schedule-item-content";

        const title = document.createElement("p");

        title.className = "schedule-title";
        title.textContent = schedule.title;

        const type = document.createElement("p");

        type.className = "schedule-type";
        type.textContent = scheduleTypes[schedule.type];

        content.append(title, type);

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "삭제";

        deleteButton.addEventListener("click", () => {

            const index = schedules.findIndex(
                (item) => item.id === schedule.id
            );

            if (index !== -1) {
                schedules.splice(index, 1);
            }

            renderCalendar();
            renderSchedules();
            updateCompletedCount();

        });

        item.append(checkbox, content, deleteButton);

        scheduleList.appendChild(item);

    });

}


function updateCompletedCount() {

    const completedCount = schedules.filter(
        (schedule) => schedule.completed
    ).length;

    document.querySelector("#completed-count").textContent =
        `${completedCount}개`;

}


scheduleForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const title = scheduleTitle.value.trim();

    if (!title) {
        return;
    }

    schedules.push({
        id: nextScheduleId,
        date: selectedDate,
        title: title,
        type: scheduleType.value,
        completed: false
    });

    nextScheduleId += 1;

    scheduleTitle.value = "";

    renderCalendar();
    renderSchedules();
    updateCompletedCount();

});


document.querySelector("#prev-month").addEventListener("click", () => {

    displayedMonth -= 1;

    if (displayedMonth < 0) {

        displayedMonth = 11;
        displayedYear -= 1;

    }

    renderCalendar();

});


document.querySelector("#next-month").addEventListener("click", () => {

    displayedMonth += 1;

    if (displayedMonth > 11) {

        displayedMonth = 0;
        displayedYear += 1;

    }

    renderCalendar();

});


/* LEARNING MATERIALS */

const materialForm = document.querySelector("#material-form");
const materialList = document.querySelector("#material-list");

const materials = [];

let nextMaterialId = 1;


function renderMaterials() {

    materialList.replaceChildren();

    if (materials.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "등록된 학습 자료가 없어.";

        materialList.appendChild(emptyMessage);

        return;

    }

    materials.forEach((material) => {

        const item = document.createElement("div");

        item.className = "material-item";

        const top = document.createElement("div");

        top.className = "material-item-top";

        const information = document.createElement("div");

        const title = document.createElement("h3");

        title.textContent = material.title;

        const description = document.createElement("p");

        description.textContent =
            `${material.current} / ${material.total}페이지`;

        information.append(title, description);

        const percentage = material.total > 0
            ? Math.min(100, material.current / material.total * 100)
            : 0;

        const percentageText = document.createElement("strong");

        percentageText.textContent = `${percentage.toFixed(1)}%`;

        top.append(information, percentageText);

        const track = document.createElement("div");

        track.className = "progress-track";

        const bar = document.createElement("div");

        bar.className = "progress-bar";
        bar.style.width = `${percentage}%`;

        track.appendChild(bar);

        const bottom = document.createElement("div");

        bottom.className = "material-item-bottom";

        const remaining = document.createElement("span");

        remaining.textContent =
            `남은 페이지 ${Math.max(0, material.total - material.current)}p`;

        const updateButton = document.createElement("button");

        updateButton.type = "button";
        updateButton.textContent = "진도 수정";

        updateButton.addEventListener("click", () => {

            const input = prompt(
                "현재까지 공부한 페이지를 입력해 줘.",
                material.current
            );

            if (input === null || input.trim() === "") {
                return;
            }

            const page = Number(input);

            if (
                !Number.isInteger(page) ||
                page < 0 ||
                page > material.total
            ) {

                alert(`0부터 ${material.total} 사이의 정수를 입력해 줘.`);

                return;

            }

            material.current = page;

            renderMaterials();

        });

        bottom.append(remaining, updateButton);

        item.append(top, track, bottom);

        materialList.appendChild(item);

    });

}


materialForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const title = document.querySelector("#material-title").value.trim();

    const total = Number(document.querySelector("#material-total").value);

    const current = Number(
        document.querySelector("#material-current").value
    );

    if (
        !title ||
        !Number.isInteger(total) ||
        !Number.isInteger(current) ||
        total < 1 ||
        current < 0 ||
        current > total
    ) {

        alert("자료 이름과 페이지 수를 올바르게 입력해 줘.");

        return;

    }

    materials.push({
        id: nextMaterialId,
        title: title,
        total: total,
        current: current
    });

    nextMaterialId += 1;

    materialForm.reset();

    renderMaterials();

});


/* INITIALIZE */

resetTimer();

renderCalendar();
renderSchedules();
renderMaterials();
renderRecords();
updateTodayTotal();
updateCompletedCount();
