package com.studylog.studylog;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/study-records")
public class StudyRecordController {

    private final JdbcTemplate jdbcTemplate;

    public StudyRecordController(JdbcTemplate jdbcTemplate) {
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

    // 공부 기록 저장
    @PostMapping
    public Map<String, Object> saveRecord(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Object labelValue = request.get("label");
        Object secondsValue = request.get("seconds");

        if (!(labelValue instanceof String)
                || ((String) labelValue).isBlank()
                || !(secondsValue instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "공부 기록 정보를 확인해 주세요."
            );
        }

        String label = ((String) labelValue).trim();
        int seconds = ((Number) secondsValue).intValue();

        if (seconds <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "공부 시간은 1초 이상이어야 합니다."
            );
        }

        Long userId = getUserId(authentication);

        jdbcTemplate.update(
                "INSERT INTO study_records (user_id, label, seconds) " +
                "VALUES (?, ?, ?)",
                userId,
                label,
                seconds
        );

        return Map.of(
                "message", "공부 기록이 저장되었습니다.",
                "label", label,
                "seconds", seconds
        );
    }

    // 공부 기록 조회
    @GetMapping
    public List<Map<String, Object>> getRecords(
            Authentication authentication) {

        Long userId = getUserId(authentication);

        return jdbcTemplate.queryForList(
                "SELECT id, label, seconds, studied_at " +
                "FROM study_records " +
                "WHERE user_id = ? ORDER BY id DESC",
                userId
        );
    }

    // 공부 기록 삭제
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteRecord(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserId(authentication);

        int deletedRows = jdbcTemplate.update(
                "DELETE FROM study_records " +
                "WHERE id = ? AND user_id = ?",
                id,
                userId
        );

        if (deletedRows == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "공부 기록을 찾을 수 없습니다."
            );
        }

        return Map.of(
                "message", "공부 기록이 삭제되었습니다."
        );
    }
}
