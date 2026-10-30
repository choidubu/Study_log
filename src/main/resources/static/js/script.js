/* TIMER */

const timerDisplay = document.querySelector("#timer-display");
const todayTotal = document.querySelector("#today-total");
const timerMessage = document.querySelector("#timer-message");
const goalHoursInput = document.querySelector("#goal-hours");
const goalTargetDisplay = document.querySelector("#goal-target-display");
const goalProgressText = document.querySelector("#goal-progress-text");
const goalProgressBar = document.querySelector("#goal-progress-bar");
const goalProgressPercent = document.querySelector("#goal-progress-percent");

let dailyGoalHours = 3;

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


function formatStudyDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}시간 ${minutes}분`;
    }

    if (hours > 0) {
        return `${hours}시간`;
    }

    if (minutes > 0) {
        return `${minutes}분`;
    }

    return `${seconds}초`;
}


function updateTimerDisplay() {

    const seconds = timerMode === "stopwatch"
        ? timerSeconds
        : remainingSeconds;

    timerDisplay.textContent = formatTime(seconds);

}


function updateTodayTotal() {
    todayTotal.textContent = formatTime(todayStudySeconds);

    updateGoalProgress();
}

function updateGoalProgress() {
    const targetSeconds = dailyGoalHours * 3600;

    const percentage = Math.min(
        100,
        Math.floor(todayStudySeconds / targetSeconds * 100)
    );

    goalTargetDisplay.textContent = `${dailyGoalHours}시간`;

    goalProgressText.textContent =
        `${formatTime(todayStudySeconds)} / ${formatTime(targetSeconds)}`;

    goalProgressBar.style.width = `${percentage}%`;

    goalProgressPercent.textContent = percentage >= 100
        ? "목표 달성! 🎉"
        : `${percentage}% 달성`;
}


async function loadStudyRecords() {

    try {
        const response = await fetch("/api/study-records");

        if (!response.ok) {
            throw new Error("공부 기록을 불러오지 못했어.");
        }

        const records = await response.json();

        studyRecords.splice(0, studyRecords.length);

        records.forEach((record) => {
            studyRecords.push({
                id: record.id,
                label: record.label,
                seconds: record.seconds
            });
        });

        todayStudySeconds = studyRecords.reduce(
            (total, record) => total + record.seconds,
            0
        );

        updateTodayTotal();
        renderRecords();

    } catch (error) {
        console.error("공부 기록 조회 오류:", error);
    }

}


async function renderRecords() {

    const recordList = document.querySelector("#record-list");

    recordList.replaceChildren();

    if (studyRecords.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "아직 저장된 공부 기록이 없어.";

        recordList.appendChild(emptyMessage);

        return;

    }

    studyRecords.forEach((record) => {

        const item = document.createElement("div");
        item.className = "record-item";

        const information = document.createElement("div");
        information.className = "record-information";

        const description = document.createElement("span");
        description.className = "record-title";
        description.textContent = record.label;

        const duration = document.createElement("span");
        duration.className = "record-duration";
        duration.textContent = formatStudyDuration(record.seconds);

        information.append(description, duration);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "삭제";

        deleteButton.addEventListener("click", async () => {

            try {

                const response = await fetch(
                    `/api/study-records/${record.id}`,
                    {
                        method: "DELETE"
                    }
                );

                if (!response.ok) {
                    throw new Error("기록 삭제에 실패했어.");
                }

                await loadStudyRecords();

            } catch (error) {

                console.error("공부 기록 삭제 오류:", error);
                alert("기록을 삭제하지 못했어. 서버 연결을 확인해 줺.");

            }

        });

        item.append(information, deleteButton);

        recordList.appendChild(item);

    });

}


async function saveStudyRecord(seconds, label) {

    if (seconds <= 0) {
        return false;
    }

    try {
        const response = await fetch("/api/study-records", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                label: label,
                seconds: seconds
            })
        });

        if (!response.ok) {
            throw new Error("공부 기록 저장에 실패했어.");
        }

        await loadStudyRecords();

        return true;

    } catch (error) {
        console.error("공부 기록 저장 오류:", error);
        alert("공부 기록을 저장하지 못했어. 서버 연결을 확인해 줘.");

        return false;
    }

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


    saveButton.addEventListener("click", async () => {

        saveButton.disabled = true;

        const saved = await saveStudyRecord(
            pendingStudySeconds,
            timerMode === "stopwatch" ? "스톱워치" : "카운트다운"
        );

        if (saved) {
            timerMessage.textContent = "공부 기록을 저장했어!";

            sessionFinished = false;
            pendingStudySeconds = 0;

            saveButton.remove();
        } else {
            saveButton.disabled = false;
        }

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

document.querySelector("#goal-save-button").addEventListener("click", () => {
    const hours = Number(goalHoursInput.value);

    if (
        !Number.isInteger(hours) ||
        hours < 1 ||
        hours > 24
    ) {
        alert("목표 시간은 1시간부터 24시간까지 입력해 줘.");
        return;
    }

    dailyGoalHours = hours;

    updateGoalProgress();
});


document.querySelector("#manual-save-button").addEventListener("click", async () => {

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

    const saved = await saveStudyRecord(totalSeconds, "직접 입력");

    if (saved) {
        document.querySelector("#manual-hours").value = "";
        document.querySelector("#manual-minutes").value = "";

        timerMessage.textContent = "공부 시간을 기록에 추가했어!";
    }

});


/* CALENDAR */

const calendarMonth = document.querySelector("#calendar-month");
const calendarDays = document.querySelector("#calendar-days");
const selectedDateTitle = document.querySelector("#selected-date-title");

const scheduleForm = document.querySelector("#schedule-form");
const scheduleTitle = document.querySelector("#schedule-title");
const scheduleType = document.querySelector("#schedule-type");
const scheduleDate = document.querySelector("#schedule-date");
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

let schedules = [];

// 날짜 입력창의 초기 날짜 설정
scheduleDate.value = selectedDate;


function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// 서버에서 일정 불러오기
async function loadSchedules() {
    try {
        const response = await fetch("/api/schedules");

        if (!response.ok) {
            throw new Error("일정을 불러오지 못했습니다.");
        }

        const data = await response.json();

        schedules = data.map((schedule) => ({
            id: schedule.id,
            date: String(schedule.schedule_date).slice(0, 10),
            title: schedule.title,
            type: schedule.schedule_type,
            completed: schedule.completed
        }));

        renderCalendar();
        renderSchedules();
        updateCompletedCount();

    } catch (error) {
        console.error("일정 조회 오류:", error);
        alert("일정을 불러오지 못했어. 서버와 DB를 확인해 줘.");
    }
}


// 달력 그리기
function renderCalendar() {
    calendarMonth.textContent =
        `${displayedYear}년 ${displayedMonth + 1}월`;

    calendarDays.replaceChildren();

    const firstDay = new Date(
        displayedYear,
        displayedMonth,
        1
    ).getDay();

    const lastDate = new Date(
        displayedYear,
        displayedMonth + 1,
        0
    ).getDate();

    for (let i = 0; i < firstDay; i += 1) {
        calendarDays.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= lastDate; day += 1) {
        const dateKey =
            `${displayedYear}-${String(displayedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayButton = document.createElement("button");

        dayButton.type = "button";
        dayButton.className = "calendar-day";
        dayButton.dataset.date = dateKey;

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
            scheduleDate.value = dateKey;

            renderCalendar();
            renderSchedules();
        });

        calendarDays.appendChild(dayButton);
    }
}


// 선택한 날짜의 일정 표시
function renderSchedules() {
    selectedDateTitle.textContent = `${selectedDate} 일정`;

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

        // 완료 상태를 DB에 저장
        checkbox.addEventListener("change", async () => {
            try {
                const response = await fetch(
                    `/api/schedules/${schedule.id}/completed`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            completed: checkbox.checked
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error("일정 상태 변경에 실패했습니다.");
                }

                await loadSchedules();

            } catch (error) {
                console.error("일정 완료 상태 변경 오류:", error);
                alert("완료 상태를 저장하지 못했어.");

                await loadSchedules();
            }
        });

        const content = document.createElement("div");

        content.className = "schedule-item-content";

        const title = document.createElement("p");

        title.className = "schedule-title";
        title.textContent = schedule.title;

        const type = document.createElement("p");

        type.className = "schedule-type";
        type.textContent = scheduleTypes[schedule.type] ?? schedule.type;

        content.append(title, type);

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "삭제";

        // DB에서 일정 삭제
        deleteButton.addEventListener("click", async () => {
            try {
                const response = await fetch(
                    `/api/schedules/${schedule.id}`,
                    {
                        method: "DELETE"
                    }
                );

                if (!response.ok) {
                    throw new Error("일정 삭제에 실패했습니다.");
                }

                await loadSchedules();

            } catch (error) {
                console.error("일정 삭제 오류:", error);
                alert("일정을 삭제하지 못했어. 서버 로그를 확인해 줘.");
            }
        });

        item.append(checkbox, content, deleteButton);

        scheduleList.appendChild(item);
    });
}


// 완료한 일정 개수
function updateCompletedCount() {
    const completedCount = schedules.filter(
        (schedule) => schedule.completed
    ).length;

    document.querySelector("#completed-count").textContent =
        `${completedCount}개`;
}


// 날짜 입력창에서 날짜를 바꾸면 달력 선택도 동기화
scheduleDate.addEventListener("change", () => {
    if (!scheduleDate.value) {
        return;
    }

    selectedDate = scheduleDate.value;

    const [year, month] = selectedDate.split("-").map(Number);

    displayedYear = year;
    displayedMonth = month - 1;

    renderCalendar();
    renderSchedules();
});


// 일정 등록 후 서버에서 다시 불러오기

scheduleForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = scheduleTitle.value.trim();
    const dateToSave = scheduleDate.value;

    if (!title) {
        return;
    }

    if (!dateToSave) {
        alert("일정 날짜를 선택해 줘.");
        return;
    }

    // 입력창에서 선택한 날짜를 그대로 사용
    selectedDate = dateToSave;

    const [year, month] = dateToSave.split("-").map(Number);

    displayedYear = year;
    displayedMonth = month - 1;

    try {
        const response = await fetch("/api/schedules", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date: scheduleDate.value,
                title: title,
                type: scheduleType.value
            })
        });

        if (!response.ok) {
            const errorMessage = await response.text();

            throw new Error(
                `일정 등록 실패 (${response.status}): ${errorMessage}`
            );
        }

        scheduleTitle.value = "";

        await loadSchedules();

    } catch (error) {
        console.error("일정 등록 오류:", error);
        alert("일정을 등록하지 못했어. 브라우저 콘솔과 서버 로그를 확인해 줘.");
    }
});



// 이전 달
document.querySelector("#prev-month").addEventListener("click", () => {
    displayedMonth -= 1;

    if (displayedMonth < 0) {
        displayedMonth = 11;
        displayedYear -= 1;
    }

    renderCalendar();
});


// 다음 달
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

let materials = [];


// 서버에서 학습 자료 불러오기
async function loadMaterials() {
    try {
        const response = await fetch("/api/learning-materials");

        if (!response.ok) {
            throw new Error("학습 자료를 불러오지 못했습니다.");
        }

        const data = await response.json();

        materials = data.map((material) => ({
            id: material.id,
            title: material.title,
            total: material.total_pages,
            current: material.current_page
        }));

        renderMaterials();

    } catch (error) {
        console.error("학습 자료 조회 오류:", error);
        alert("학습 자료를 불러오지 못했어. 서버와 DB를 확인해 줘.");
    }
}


// 학습 자료 목록과 진도율 표시
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
            `${material.current} / ${material.total}`;

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
            `남은 진도 ${Math.max(0, material.total - material.current)}`;

        const updateButton = document.createElement("button");

        updateButton.type = "button";
        updateButton.textContent = "진도 수정";

        // 수정한 진도를 서버에 저장
        updateButton.addEventListener("click", async () => {
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
                alert(
                    `0부터 ${material.total} 사이의 정수를 입력해 줘.`
                );

                return;
            }

            try {
                const response = await fetch(
                    `/api/learning-materials/${material.id}/progress`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            current: page
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `진도 저장 실패 (${response.status})`
                    );
                }

                await loadMaterials();

            } catch (error) {
                console.error("학습 진도 저장 오류:", error);
                alert("진도를 저장하지 못했어. 서버 로그를 확인해 줘.");
            }
        });

        bottom.append(remaining, updateButton);

        item.append(top, track, bottom);

        materialList.appendChild(item);
    });
}


// 학습 자료 등록
materialForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.querySelector("#material-title").value.trim();

    const total = Number(
        document.querySelector("#material-total").value
    );

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

    try {
        const response = await fetch("/api/learning-materials", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                total: total,
                current: current
            })
        });

        if (!response.ok) {
            const errorMessage = await response.text();

            throw new Error(
                `자료 등록 실패 (${response.status}): ${errorMessage}`
            );
        }

        materialForm.reset();

        await loadMaterials();

    } catch (error) {
        console.error("학습 자료 등록 오류:", error);
        alert("학습 자료를 등록하지 못했어. 서버 로그를 확인해 줘.");
    }
});


/* INITIALIZE */

resetTimer();
loadStudyRecords();
loadSchedules();
loadMaterials();
