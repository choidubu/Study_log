package com.studylog.studylog;

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
@RequestMapping("/api/learning-materials")
public class LearningMaterialController {

    private final JdbcTemplate jdbcTemplate;

    public LearningMaterialController(JdbcTemplate jdbcTemplate) {
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

    // 학습 자료 전체 조회
    @GetMapping
    public List<Map<String, Object>> getMaterials(
            Authentication authentication) {

        Long userId = getUserId(authentication);

        return jdbcTemplate.queryForList(
                "SELECT id, title, total_pages, current_page " +
                "FROM learning_materials " +
                "WHERE user_id = ? ORDER BY id DESC",
                userId
        );
    }

    // 학습 자료 등록
    @PostMapping
    public Map<String, Object> saveMaterial(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Object titleValue = request.get("title");
        Object totalValue = request.get("total");
        Object currentValue = request.get("current");

        if (!(titleValue instanceof String)
                || ((String) titleValue).isBlank()
                || !(totalValue instanceof Number)
                || !(currentValue instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "학습 자료 정보를 확인해 주세요."
            );
        }

        String title = ((String) titleValue).trim();
        int total = ((Number) totalValue).intValue();
        int current = ((Number) currentValue).intValue();

        if (total < 1 || current < 0 || current > total) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "페이지 수를 올바르게 입력해 주세요."
            );
        }

        Long userId = getUserId(authentication);

        jdbcTemplate.update(
                "INSERT INTO learning_materials " +
                "(user_id, title, total_pages, current_page) " +
                "VALUES (?, ?, ?, ?)",
                userId, title, total, current
        );

        return Map.of(
                "message", "학습 자료가 등록되었습니다."
        );
    }

    // 학습 진도 수정
    @PatchMapping("/{id}/progress")
    public Map<String, Object> updateProgress(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Object currentValue = request.get("current");

        if (!(currentValue instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "현재 페이지를 확인해 주세요."
            );
        }

        int current = ((Number) currentValue).intValue();
        Long userId = getUserId(authentication);

        List<Map<String, Object>> results = jdbcTemplate.queryForList(
                "SELECT total_pages FROM learning_materials " +
                "WHERE id = ? AND user_id = ?",
                id, userId
        );

        if (results.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "학습 자료를 찾을 수 없습니다."
            );
        }

        int total = ((Number) results.get(0).get("total_pages")).intValue();

        if (current < 0 || current > total) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "현재 페이지는 0부터 전체 페이지 수까지 입력할 수 있습니다."
            );
        }

        jdbcTemplate.update(
                "UPDATE learning_materials SET current_page = ? " +
                "WHERE id = ? AND user_id = ?",
                current, id, userId
        );

        return Map.of(
                "message", "학습 진도가 저장되었습니다.",
                "current", current
        );
    }

    // 학습 자료 삭제
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteMaterial(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserId(authentication);

        int deletedRows = jdbcTemplate.update(
                "DELETE FROM learning_materials " +
                "WHERE id = ? AND user_id = ?",
                id, userId
        );

        if (deletedRows == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "학습 자료를 찾을 수 없습니다."
            );
        }

        return Map.of(
                "message", "학습 자료가 삭제되었습니다."
        );
    }
}
