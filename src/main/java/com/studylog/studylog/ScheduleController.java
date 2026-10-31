package com.studylog.studylog;

import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final JdbcTemplate jdbcTemplate;

    public ScheduleController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 로그인한 회원의 ID 조회
    private Long getUserId(Authentication authentication) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE email = ?",
                Long.class,
                authentication.getName()
        );
    }

    // 일정 전체 조회
    @GetMapping
    public List<Map<String, Object>> getSchedules(
            Authentication authentication) {

        Long userId = getUserId(authentication);

        return jdbcTemplate.queryForList(
                "SELECT id, " +
                "TO_CHAR(schedule_date, 'YYYY-MM-DD') AS schedule_date, " +
                "title, schedule_type, completed " +
                "FROM schedules " +
                "WHERE user_id = ? " +
                "ORDER BY schedule_date, id",
                userId
        );
    }

    // 일정 등록
    @PostMapping
    public Map<String, Object> saveSchedule(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Object dateValue = request.get("date");
        Object titleValue = request.get("title");
        Object typeValue = request.get("type");

        if (!(dateValue instanceof String)
                || !(titleValue instanceof String)
                || !(typeValue instanceof String)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "일정 정보를 확인해 주세요."
            );
        }

        String dateText = ((String) dateValue).trim();
        String title = ((String) titleValue).trim();
        String type = ((String) typeValue).trim();

        if (dateText.isEmpty()
        || title.isEmpty()
        || !List.of("study", "lecture", "deadline", "exam", "general").contains(type)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "일정 정보를 올바르게 입력해 주세요."
            );
        }

        LocalDate localDate;

        try {
            localDate = LocalDate.parse(dateText);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "날짜는 YYYY-MM-DD 형식으로 입력해 주세요."
            );
        }

        Date scheduleDate = Date.valueOf(localDate);
        Long userId = getUserId(authentication);

        jdbcTemplate.update(
                "INSERT INTO schedules " +
                "(user_id, schedule_date, title, schedule_type) " +
                "VALUES (?, ?, ?, ?)",
                userId,
                scheduleDate,
                title,
                type
        );

        return Map.of(
                "message", "일정이 등록되었습니다.",
                "date", localDate.toString()
        );
    }

    // 일정 완료 상태 변경
    @PatchMapping("/{id}/completed")
    public Map<String, Object> updateCompleted(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Object value = request.get("completed");

        if (!(value instanceof Boolean)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "완료 상태가 올바르지 않습니다."
            );
        }

        Long userId = getUserId(authentication);

        int updatedRows = jdbcTemplate.update(
                "UPDATE schedules SET completed = ? " +
                "WHERE id = ? AND user_id = ?",
                value,
                id,
                userId
        );

        if (updatedRows == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "일정을 찾을 수 없습니다."
            );
        }

        return Map.of(
                "message", "일정 상태가 변경되었습니다."
        );
    }

    // 일정 삭제
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteSchedule(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserId(authentication);

        int deletedRows = jdbcTemplate.update(
                "DELETE FROM schedules WHERE id = ? AND user_id = ?",
                id,
                userId
        );

        if (deletedRows == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "삭제할 일정을 찾을 수 없습니다."
            );
        }

        return Map.of(
                "message", "일정이 삭제되었습니다."
        );
    }
}
